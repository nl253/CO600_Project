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
