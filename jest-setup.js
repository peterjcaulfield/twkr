/**
 * Jest really struggles with dynamic mocking of modules.
 *
 * In the unit tests we have some tests using a mocked version of leva
 * and others where we want to test against the real module.
 *
 * This setup file fixes two separate issues:
 *
 * - invalid hook calls when using jest.resetModules
 * - act warning when using jest.resetModules due to a call to reactDOM.render
 *   in the module code
 *
 * See these issues for a better idea:
 *
 * https://github.com/facebook/jest/issues/8987#issuecomment-584898030
 * https://stackoverflow.com/questions/63472496/testing-library-react-hooks-warning-it-looks-like-youre-using-the-wrong-act
 */
const RESET_MODULE_EXCEPTIONS = ["react", "react-dom"];

let mockActualRegistry = {};

RESET_MODULE_EXCEPTIONS.forEach((moduleName) => {
  jest.doMock(moduleName, () => {
    if (!mockActualRegistry[moduleName]) {
      mockActualRegistry[moduleName] = jest.requireActual(moduleName);
    }
    return mockActualRegistry[moduleName];
  });
});
