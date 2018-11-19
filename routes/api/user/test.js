/**
 * Test Suite for `/api/user/*`.
 *
 * Plan:
 *
 * 1. register
 * 2. expect non-null email (username)
 * 2. expect null firstName, lastName, info
 * 3. set attributes
 * 4. get attributes (expect a non-null value)
 * 3. set nullable attributes to null
 * 4. get attributes (expect a null value)
 * 4. get all info on a user (expect a null value in nullable attrs, non-null email)
 * 5. un-register
 *
 * NOTE: Carry out updating with credentials in the request body & cookies.
 *
 * 6. Check for errors:
 *
 * - you cannot un-register twice
 * - you cannot log in after you un-register
 * - you cannot GET an un-registered user's info
 * - you cannot GET an un-registered user's fields
 * - you cannot update an un-registered user's fields
 *
 * NOTE: Check that proper status codes are being sent.
 * NOTE: Check that the data sent is in correct format & has the properties you expect.
 *
 * @author Norbert
 */

// Standard Library
// const {spawn} = require('child_process');

// My Code
const {httpClient, log, randUser} = require('../testUtils');
const {pprint} = require('../../../lib');
const TEST_RUNS = process.env.TEST_RUNS || 20;

// 3rd Party
const faker = require('faker');
let token;
// let serverProcess;

// beforeAll(() => {
//   log.info(`testing ${__filename} part of the REST API, starting server`);
//   serverProcess = spawn('npm', ['run', 'start']);
//   const start = new Date().getSeconds();
//   while (Math.abs((new Date().getSeconds() - start)) < 4) {
//     // wait & do nothing
//   }
// });
//
// afterAll(() => {
//   log.info(`finished testing ${__filename} in REST API, killing server`);
//   serverProcess.kill();
// });

log.info(`running ${__filename} test suite ${TEST_RUNS}x`);

for (let i = 0; i < TEST_RUNS; i++) {
  let user = randUser();
  let {email, password} = user;
  let credentials = {email, password};
  let token;

  const logInReq = () => httpClient.post('/user/login', credentials);

  describe(`mock user ${pprint(user)}`, () => {

    test(`registration of ${email}`, async () => {
      const res = await httpClient.post('/user/register', credentials);
      expect.assertions(4);
      expect(res.status).toBeLessThanOrEqual(300);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'OK');
    });

    test(`email of ${email} is not null after registration`, async () => {
      const res = await httpClient.get(`/user/${email}/email`);
      expect.assertions(5);
      expect(res.status).toBeLessThanOrEqual(300);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'OK');
      expect(res.data).toHaveProperty('result', email);
    });

    test(`${email} is not an admin by default after registration`, async () => {
      const res = await httpClient.get(`/user/${email}/isAdmin`);
      expect.assertions(5);
      expect(res.status).toBeLessThanOrEqual(300);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'OK');
      expect(res.data).toHaveProperty('result', false);
    });

    const nullAttrs = ['firstName', 'lastName', 'info'];

    for (const attr of nullAttrs) {

      describe(`nullable attribute ${attr}`, () => {

        const value = faker.random.word();

        test(`GET request for ${email}'s ${attr}  yields null after registration`, async () => {
          const res = await httpClient.get(`/user/${email}/${attr}`);
          expect.assertions(5);
          expect(res.status).toBeLessThanOrEqual(300);
          expect(res.status).toBeGreaterThanOrEqual(200);
          expect(res.data).toHaveProperty('msg');
          expect(res.data).toHaveProperty('status', 'OK');
          expect(res.data).toHaveProperty('result', null);
        });

        describe('about to log in', () => {

          test(`POST request to log in as newly registered ${email}`, async () => {
            const res = await logInReq();
            token = res.data.result;
            expect.assertions(6);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.status).toBeLessThanOrEqual(300);
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.data).toHaveProperty('msg');
            expect(res.data).toHaveProperty('result');
            expect(res.data).toHaveProperty('status', 'OK');
          });

          test(`POST request to update ${email}'s ${attr} to ${value} after logging in with token in cookies`, async () => {
            const res = await httpClient.post(`/user/${attr}`, {value}, {headers: {Cookie: `token=${token}`}});
            expect.assertions(4);
            expect(res.status).toBeLessThanOrEqual(300);
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.data).toHaveProperty('msg');
            expect(res.data).toHaveProperty('status', 'OK');
          });

          test(`POST request to log ${email} out after updating their ${attr} with token in cookies`, async () => {
            const res = await httpClient.get('/user/logout', {headers: {Cookie: `token=${token}`}});
            expect.assertions(4);
            expect(res.status).toBeLessThanOrEqual(300);
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.data).toHaveProperty('msg');
            expect(res.data).toHaveProperty('status', 'OK');
          });
        });

        test(`GET request to access ${email}'s ${attr} yields ${value} after updating`, async () => {
          const res = await httpClient.get(`/user/${email}/${attr}`);
          expect.assertions(5);
          expect(res.status).toBeLessThanOrEqual(300);
          expect(res.status).toBeGreaterThanOrEqual(200);
          expect(res.data).toHaveProperty('msg');
          expect(res.data).toHaveProperty('status', 'OK');
          expect(res.data).toHaveProperty('result', value);
        });
      });
    }

    test(`GET request for all info about ${email} returns all properties except for password`, async () => {
      const res = await httpClient.get(`/user/${email}`);
      expect.assertions(11);
      expect(res.status).toBeLessThanOrEqual(300);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'OK');
      expect(res.data).toHaveProperty('result');
      expect(res.data).toHaveProperty('result.email');
      expect(res.data).toHaveProperty('result.lastName');
      expect(res.data).not.toHaveProperty('result.password');
      expect(res.data).toHaveProperty('result.firstName');
      expect(res.data).toHaveProperty('result.info');
      expect(res.data).toHaveProperty('result.isAdmin', false);
    });

    test(`GET request for hashed password of ${email} fails`, async () => {
      const res = await httpClient.get(`/user/${email}/password`);
      expect.assertions(5);
      expect(res.status).toBeLessThanOrEqual(500);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'ERROR');
      expect(res.data).not.toHaveProperty('result');
    });

    describe('about to log in', () => {
      test(`POST request to log in as newly registered ${email}`, async () => {
        const res = await logInReq();
        token = res.data.result;
        expect.assertions(6);
        expect(res.headers).toHaveProperty('content-type');
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.status).toBeLessThanOrEqual(300);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'OK');
      });
      test(`POST request to update the isAdmin property in ${email} fails`, async () => {
        const res = await httpClient.post(`/user/isAdmin`, {value: true}, {headers: {Cookie: `token=${token}`}});
        expect.assertions(5);
        expect(res.status).toBeLessThanOrEqual(500);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'ERROR');
        expect(res.data).not.toHaveProperty('result');
      });
      test(`GET request to un-register ${email} with credentials in cookies`, async () => {
        const res = await httpClient.get('/user/unregister', {headers: {Cookie: `token=${token}`}});
        expect.assertions(4);
        expect(res.status).toBeLessThanOrEqual(300);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'OK');
      });
    });

    describe(`after un-register`, () => {

      test(`GET request to access all info about ${email} after they have been un-registered fails`, async () => {
        const res = await httpClient.get(`/user/${email}`);
        expect.assertions(5);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThanOrEqual(499);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'ERROR');
        expect(res.data).not.toHaveProperty('result');
      });

      for (const attr of ['firstName', 'lastName', 'info', 'isAdmin', 'email']) {

        test(`GET request for ${email}'s ${attr} after their account has been deleted fails`, async () => {
          const res = await httpClient.get(`/user/${email}/${attr}`);
          expect.assertions(5);
          expect(res.status).toBeGreaterThanOrEqual(400);
          expect(res.status).toBeLessThanOrEqual(499);
          expect(res.data).toHaveProperty('msg');
          expect(res.data).toHaveProperty('status', 'ERROR');
          expect(res.data).not.toHaveProperty('result');
        });

        const value = faker.internet.email();

        test(`POST request to update ${email}'s ${attr} to ${value} after their account has been deleted fails`, async () => {
          const res = await httpClient.post(`/user/${attr}`, {value}, {headers: {Cookie: `token=${token}`}});
          expect.assertions(4);
          expect(res.status).toBeLessThanOrEqual(499);
          expect(res.status).toBeGreaterThanOrEqual(400);
          expect(res.data).toHaveProperty('msg');
          expect(res.data).toHaveProperty('status', 'ERROR');
        });
      }

      test(`POST request to un-register ${email} who has already been un-registered fails`, async () => {
        const res = await httpClient.get('/user/unregister', {headers: {Cookie: `token=${token}`}});
        expect.assertions(5);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThanOrEqual(499);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'ERROR');
        expect(res.data).not.toHaveProperty('result');
      });

      test(`POST request to log in as un-registered ${email} fails`, async () => {
        const res = await logInReq();
        expect.assertions(5);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThanOrEqual(499);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'ERROR');
        expect(res.data).not.toHaveProperty('result');
      });
    });
  });
}
