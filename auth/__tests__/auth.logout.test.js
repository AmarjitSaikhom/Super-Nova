const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = require("../src/app");
const connectDB = require("../src/db/db");
const userModel = require("../src/models/user.model");

describe("GET /api/auth/logout", () => {
  beforeAll(async () => {
    await connectDB();
  });

  it("clears the auth cookie and returns 200 when logged in", async () => {
    // Seed and login to get cookie
    const password = "Secret123!";
    const hash = await bcrypt.hash(password, 10);
    await userModel.create({
      username: "logout_user",
      email: "logout@example.com",
      password: hash,
      fullName: { firstName: "Log", lastName: "Out" },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "logout@example.com", password });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const res = await request(app)
      .get("/api/auth/logout")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    const setCookie = res.headers["set-cookie"] || [];
    const cookieStr = setCookie.join(";");
    expect(cookieStr).toMatch(/token=;/);
    expect(cookieStr.toLowerCase()).toMatch(/expires=/);
  });

  it("is idempotent: returns 200 even without auth cookie", async () => {
    const res = await request(app).get("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});


// describe("GET /api/auth/logout", () => {
//   beforeAll(async () => {
//     await connectDB();
//   });

//   it("clears the token cookie and returns 200 when called with a valid token", async () => {
//     const password = "Secret123!";
//     const hash = await bcrypt.hash(password, 10);

//     const user = await userModel.create({
//       username: "logout_user",
//       email: "logout@example.com",
//       password: hash,
//       fullName: { firstName: "Log", lastName: "Out" },
//     });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     const res = await request(app)
//       .get("/api/auth/logout")
//       .set("Cookie", [`token=${token}`]);

//     expect(res.status).toBe(200);

//     const setCookie = res.headers["set-cookie"];
//     expect(setCookie).toBeDefined();
//     // cookie should be cleared; typically set with empty value and Expires or Max-Age=0
//     expect(setCookie.join(';')).toMatch(/token=;/);
//   });

//   it("returns 200 and ensures no token cookie when called without a token", async () => {
//     const res = await request(app).get("/api/auth/logout");
//     expect(res.status).toBe(200);

//     const setCookie = res.headers["set-cookie"];
//     expect(setCookie).toBeDefined();
//     expect(setCookie.join(';')).toMatch(/token=;/);
//   });
// });