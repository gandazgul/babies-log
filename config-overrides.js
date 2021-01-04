const path = require('path');
const { fixBabelImports, override } = require('customize-cra');

module.exports = {
    paths: (paths) => {
        paths.appIndexJs = path.resolve(__dirname, 'app/index.js');
        paths.appSrc = path.resolve(__dirname, 'app');

        return paths;
    },
    webpack: override(
        fixBabelImports('@material-ui/core', {
            libraryDirectory: 'esm',
            camel2DashComponentName: false,
        }),

        fixBabelImports('@material-ui/icons', {
            libraryDirectory: 'esm',
            camel2DashComponentName: false,
        }),
    ),
};
