module.exports = {
  packagerConfig: {
    icon: 'resources/gtasks',
    name: 'Gtasks',
    executableName: 'gtasks-wrapper',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: 'resources/gtasks.png',
        },
      },
    },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'marcelothebuilder',
          name: 'gtasks-wrapper',
        },
        prerelease: true,
      },
    },
  ],

};
