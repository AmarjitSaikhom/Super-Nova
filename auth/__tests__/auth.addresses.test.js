const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const connectDB = require("../src/db/db");
const userModel = require("../src/models/user.model");
const mongoose = require("mongoose");

describe("User addresses API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  async function seedUserAndLogin({ username = "addr_user", email = "addr@example.com" } = {}) {
    const password = "Test1234!";
    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      fullName: { firstName: "Test", lastName: "User" },
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const cookies = [`token=${token}`];

    return { user, cookies };
  }

  describe("GET /api/auth/users/me/addresses", () => {
    it("requires authentication (401 without cookie)", async () => {
      const res = await request(app).get("/api/auth/users/me/addresses");
      expect(res.status).toBe(401);
    });

    it("returns a list of addresses and indicates a default", async () => {
      const { user, cookies } = await seedUserAndLogin({
        username: "lister",
        email: "lister@example.com",
      });

      // Seed some addresses directly
      user.addresses.push(
        {
          street: "221B Baker St",
          city: "London",
          state: "LDN",
          zip: "NW16XE",
          country: "UK",
          isDefault: true,
        },
        {
          street: "742 Evergreen Terrace",
          city: "Springfield",
          state: "SP",
          zip: "49007",
          country: "USA",
          isDefault: false,
        }
      );
      await user.save();

      const res = await request(app)
        .get("/api/auth/users/me/addresses")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBe(2);
      //Imprementaion may return a separate defaultAddressId field
      // or one of the addresses with isDefault
      expect(
        "defaultAddressId" in res.body ||
          res.body.addresses.some((a) => a.isDefault === true)
      ).toBe(true);
    });
  });

  describe("POST /api/auth/users/me/addresses", () => {
    it("validates zip and returns 400 on invalid input", async () => {
      const { cookies } = await seedUserAndLogin({
        username: "adder1",
        email: "adder1@example.com",
      });

      const res = await request(app)
        .post("/api/auth/users/me/addresses")
        .set("Cookie", cookies)
        .send({
          street: "12 Invalid Ave",
          city: "Nowhere",
          state: "NA",
    zip: "", // Invalid: empty
          country: "US",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors || res.body.message).toBeDefined();
    });

    it("adds an address and can set it as default", async () => {
      const { cookies } = await seedUserAndLogin({
        username: "adder2",
        email: "adder@example.com",
      });

      const res = await request(app)
        .post("/api/auth/users/me/addresses")
        .set("Cookie", cookies)
        .send({
          street: "1600 Amphitheatre Pkwy",
          city: "Mountain View",
          state: "CA",
          zip: "94043",
          country: "USA",
          isDefault: true,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.address).toBeDefined();
      const addr = res.body.address;
      expect(addr.street).toBe("1600 Amphitheatre Pkwy");
      expect(
        addr.isDefault === true || typeof res.body.defaultAddressId === "string"
      ).toBe(true);
    });
  });

  describe("DELETE /api/auth/users/me/addresses/:addressId", () => {
    it("removes an address; returns 200 and updated list", async () => {
      const { user, cookies } = await seedUserAndLogin({
        username: "deleter",
        email: "deleter@gmail.com",
      });

      // seed two addresses and save
      user.addresses.push(
        {
          street: "10 Downing St",
          city: "London",
          state: "LDN",
          zip: "SW1A2AA",
          country: "UK",
          isDefault: true,
        },
        {
          street: "1600 Pennsylvania Ave",
          city: "Washington",
          state: "DC",
          zip: "20500",
          country: "USA",
          isDefault: false,
        }
      );
      await user.save();

      const idToDelete = user.addresses[0]._id.toString();

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${idToDelete}`)
        .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.addresses)).toBe(true);
  const remainingIds = res.body.addresses.map((a) => (a._id && a._id.toString) ? a._id.toString() : a._id);
  expect(remainingIds).not.toContain(idToDelete);


    });

    it("returns 404 when addressId not found", async () => {
      const { cookies } = await seedUserAndLogin({
        username: "deleter2",
        email: "deleter2@example.com",
      });

      const fakeId = new mongoose.Types.ObjectId().toString(); // Assuming this ID does not exist

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${fakeId}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(404);
    });
  });
});
