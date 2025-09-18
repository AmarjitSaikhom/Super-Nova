const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const connectDB = require("../src/db/db");
const userModel = require("../src/models/user.model");

// THIS IS FROM THE COHORT VIDEO
describe("GET /api/auth/me", () => {
  beforeAll(async () => {
    await connectDB();
  });

  it("returns 401 when no auth cookie is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid token in cookie", async () => {
    const fakeToken = jwt.sign(
      { id: "000000000000000000000000" },
      "wrong_secret"
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${fakeToken}`]);
    expect(res.status).toBe(401);
  });

  it("returns 200 and current user when valid token cookie is present", async () => {
    const password = "Secret123!";
    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username: "me_user",
      email: "me@example.com",
      password: hash,
      fullName: { firstName: "Me", lastName: "User" },
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

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("me@example.com");
    expect(res.body.user.password).toBeUndefined();
  });
});

// THIS IS WRITTEN BY MY AI COPILOT

// describe("GET /api/auth/me", () => {
//   beforeAll(async () => {
//     await connectDB();
//   });

//   it("returns 200 and the authenticated user when a valid token cookie is present", async () => {
//     const password = "MyPass123!";
//     const hash = await bcrypt.hash(password, 10);

//     const user = await userModel.create({
//       username: "me_user",
//       email: "me@example.com",
//       password: hash,
//       fullName: { firstName: "Me", lastName: "User" },
//     });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     const res = await request(app)
//       .get("/api/auth/me")
//       .set("Cookie", [`token=${token}`]);

//     expect(res.status).toBe(200);
//     expect(res.body.user).toBeDefined();
//     expect(res.body.user.email).toBe("me@example.com");
//     expect(res.body.user.password).toBeUndefined();
//   });

//   it("returns 401 when no token cookie is provided", async () => {
//     const res = await request(app).get("/api/auth/me");
//     expect(res.status).toBe(401);
//   });

//   it("returns 401 when token is invalid", async () => {
//     const res = await request(app)
//       .get("/api/auth/me")
//       .set("Cookie", ["token=invalidtoken"]);

//     expect(res.status).toBe(401);
//   });
// });
