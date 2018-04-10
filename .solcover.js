module.exports = {
    skipFiles: ['Migrations.sol'],
    // need for dependencies
    copyNodeModules: true,
    copyPackages: ['zeppelin-solidity'],
    dir: '.',
    norpc: false
};
