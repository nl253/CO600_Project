/**
 * Test Suite for `/module/*`.
 *
 * Plan:
 *
 * 1. create a new content (because Module(content_id) is FK NOT NULL)
 * 2. create a new module referencing the content
 * 3. get all fields expect object
 * 3. for every filed get field expect nullable value
 * 4. for every field set field to value (name and field)
 * 4. for every field expect non-nullable value
 * 5. delete the module (should DELETE CASCADE)
 * 6. check that it cascaded by seeing if the content exists
 */
const testUtils = require('./testUtils');

const {
  afterAll: after,
  beforeAll: before,
  testGET,
  testPOST,
  testSuggest,

} = testUtils;

const NO_RUNS = 10;

beforeAll(() => before());
afterAll(() => after());

/**
 * Some routes will not yield any data nor will they modify the database but act as directories.
 *
 * If you type `/module` you should get a hint suggesting where you might want to go next (e.g. /module/<name>).
 */
testSuggest('/module');

/**
 * Checks module-related sequences of actions such:
 *
 * 1. create
 * 2. expect non-null name (PK)
 * 3. set attribute
 * 4. get attribute (expect a value)
 * 5. delete
 */
