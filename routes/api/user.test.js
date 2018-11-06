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
const {spawn} = require('child_process');

// My Code
const testUtils = require('./testUtils');
const {instance, log, randUser} = testUtils;
const {pprint} = require('./../lib');

// 3rd Party
const faker = require('faker');
const maybe = faker.random.boolean;

const NO_RUNS = 20;
let serverProcess;

beforeAll(() => {
  log.info(`testing ${__filename} part of the REST API, starting server`);
  serverProcess = spawn('npm', ['run', 'start']);
  const start = new Date().getSeconds();
  while (Math.abs((new Date().getSeconds() - start)) < 4) {
    // wait & do nothing
  }
});

afterAll(() => {
  log.info(`finished testing ${__filename} in REST API, killing server`);
  serverProcess.kill();
});

log.info(`running ${__filename} test suite ${NO_RUNS}x`);

for (let i = 0; i < NO_RUNS; i++) {
  let cookie; // to be set AFTER logging in
  let user = randUser();
  let {email, password} = user;
  let credentials = {email, password};

  describe(`mock user ${pprint(user)}`, () => {

    test(`registration of ${email}`, async () => {
      const res = await instance.request({
        method: 'post',
        url: '/user/register',
        data: credentials,
      });
      expect.assertions(4);
      expect(res.status).toBeLessThanOrEqual(300);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'OK');
    });

    test(`email of ${email} is not null after registration`,
      async () => {
        const res = await instance.request({
          method: 'get',
          url: `/user/${email}/email`,
        });
        expect.assertions(5);
        expect(res.status).toBeLessThanOrEqual(300);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'OK');
        expect(res.data).toHaveProperty('result', email);
      });

    test(`${email} is not an admin by default after registration`,
      async () => {
        const res = await instance.request({
          method: 'get',
          url: `/user/${email}/isAdmin`,
        });
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

        test(
          `GET request for ${email}'s ${attr}  yields null after registration`,
          async () => {
            const res = await instance.request({
              method: 'get',
              url: `/user/${email}/${attr}`,
            });
            expect.assertions(5);
            expect(res.status).toBeLessThanOrEqual(300);
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.data).toHaveProperty('msg');
            expect(res.data).toHaveProperty('status', 'OK');
            expect(res.data).toHaveProperty('result', null);
          });

        if (maybe()) {

          test(
            `POST request to update ${email}'s ${attr} to ${value} with password & value in the request body`,
            async () => {
              const res = await instance.request({
                method: 'post',
                url: `/user/${email}/${attr}`,
                data: {password, value},
              });
              expect.assertions(4);
              expect(res.status).toBeLessThanOrEqual(300);
              expect(res.status).toBeGreaterThanOrEqual(200);
              expect(res.data).toHaveProperty('msg');
              expect(res.data).toHaveProperty('status', 'OK');
            });

        } else {

          test(
            `POST request to log in in as newly registered ${email} to set ${attr} to ${value}`,
            async () => {
              const res = await instance.request({
                method: 'post',
                url: `/user/login`,
                data: credentials,
              });
              cookie = res.headers['set-cookie'].join(' ; ');
              expect.assertions(4);
              expect(res.status).toBeLessThanOrEqual(300);
              expect(res.status).toBeGreaterThanOrEqual(200);
              expect(res.data).toHaveProperty('msg');
              expect(res.data).toHaveProperty('status', 'OK');
            });

          test(
            `POST request to update ${email}'s ${attr} to ${value} after logging in`,
            async () => {
              const res = await instance.request({
                method: 'post',
                url: `/user/${email}/${attr}`,
                headers: {cookie},
                data: {password, value},
              });
              expect.assertions(4);
              expect(res.status).toBeLessThanOrEqual(300);
              expect(res.status).toBeGreaterThanOrEqual(200);
              expect(res.data).toHaveProperty('msg');
              expect(res.data).toHaveProperty('status', 'OK');
            });

          test(`POST request to log ${email} out after updating their ${attr}`,
            async () => {
              const res = await instance.request({
                method: 'post',
                headers: {cookie},
                url: `/user/logout`,
                withCredentials: true,
              });
              cookie = undefined;
              expect.assertions(4);
              expect(res.status).toBeLessThanOrEqual(300);
              expect(res.status).toBeGreaterThanOrEqual(200);
              expect(res.data).toHaveProperty('msg');
              expect(res.data).toHaveProperty('status', 'OK');
            });
        }

        test(
          `GET request to access ${email}'s ${attr} yields ${value} after updating`,
          async () => {
            const res = await instance.request({
              method: 'get',
              url: `/user/${email}/${attr}`,
            });
            expect.assertions(5);
            expect(res.status).toBeLessThanOrEqual(300);
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.data).toHaveProperty('msg');
            expect(res.data).toHaveProperty('status', 'OK');
            expect(res.data).toHaveProperty('result', value);
          });
      });
    }
  });

  test(
    `GET request for all info about ${email} returns all properties except for password`,
    async () => {
      expect.assertions(11);
      const res = await instance.request({
        method: 'get',
        url: `/user/${email}`,
      });
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
    const res = await instance.request({
      method: 'get',
      url: `/user/${email}/password`,
    });
    expect.assertions(5);
    expect(res.status).toBeLessThanOrEqual(500);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.data).toHaveProperty('msg');
    expect(res.data).toHaveProperty('status', 'ERROR');
    expect(res.data).not.toHaveProperty('result');
  });

  test(`POST request to set the isAdmin property in ${email} fails`,
    async () => {
      const res = await instance.request({
        method: 'post',
        url: `/user/${email}/isAdmin`,
        data: credentials,
      });
      expect.assertions(5);
      expect(res.status).toBeLessThanOrEqual(500);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'ERROR');
      expect(res.data).not.toHaveProperty('result');
    });

  if (maybe()) {

    test(
      `POST request to un-register ${email} with credentials in the request body`,
      async () => {
        const res = await instance.request({
          method: 'post',
          url: '/user/unregister',
          data: credentials,
        });
        cookie = undefined;
        expect.assertions(4);
        expect(res.status).toBeLessThanOrEqual(300);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'OK');
      });

  } else {

    test(
      `POST request to log in as newly registered ${email} to un-register with credentials in the request body`,
      async () => {
        const res = await instance.request({
          method: 'post',
          url: `/user/login`,
          data: credentials,
        });
        cookie = res.headers['set-cookie'].join(' ; ');
        expect.assertions(4);
        expect(res.status).toBeLessThanOrEqual(300);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'OK');
      });

    test(`POST request to un-register ${email} with credentials in cookies`,
      async () => {
        const res = await instance.request({
          method: 'post',
          url: '/user/unregister',
          withCredentials: true,
          headers: {cookie},
        });
        cookie = undefined;
        expect.assertions(4);
        expect(res.status).toBeLessThanOrEqual(300);
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'OK');
      });
  }

  test(
    `GET request to access all info about ${email} after they have been un-registered fails`,
    async () => {
      const res = await instance.request({
        method: 'get',
        url: `/user/${email}`,
      });
      expect.assertions(5);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThanOrEqual(499);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'ERROR');
      expect(res.data).not.toHaveProperty('result');
    });

  for (const attr of ['firstName', 'lastName', 'info', 'isAdmin', 'email']) {
    test(
      `GET request for ${email}'s ${attr} after their account has been deleted fails`,
      async () => {
        const res = await instance.request({
          method: 'get',
          url: `/user/${email}/${attr}`,
        });
        expect.assertions(5);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThanOrEqual(499);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'ERROR');
        expect(res.data).not.toHaveProperty('result');
      });

    const value = faker.internet.email();

    test(
      `POST request to update ${email}'s ${attr} to ${value} after their account has been deleted fails`,
      async () => {
        const res = await instance.request({
          method: 'post',
          url: `/user/${email}/${attr}`,
          data: {password, value},
        });
        expect.assertions(4);
        expect(res.status).toBeLessThanOrEqual(499);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.data).toHaveProperty('msg');
        expect(res.data).toHaveProperty('status', 'ERROR');
      });
  }

  test(
    `POST request to un-register ${email} who has already been un-registered fails`,
    async () => {
      const res = await instance.request({
        method: 'post',
        url: '/user/unregister',
        data: credentials,
      });
      expect.assertions(5);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThanOrEqual(499);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'ERROR');
      expect(res.data).not.toHaveProperty('result');
    });

  test(`POST request to log in in as un-registered ${email} fails`,
    async () => {
      const res = await instance.request({
        method: 'post',
        url: `/user/login`,
      });
      expect.assertions(5);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThanOrEqual(499);
      expect(res.data).toHaveProperty('msg');
      expect(res.data).toHaveProperty('status', 'ERROR');
      expect(res.data).not.toHaveProperty('result');
    });
}
