const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

// Helper function untuk check file icon
const getIconPath = (iconName, extension = 'ico') => {
  const iconPath = path.join(__dirname, 'public', 'assets', `${iconName}.${extension}`);
  return fs.existsSync(iconPath) ? iconPath : null;
};

// Icon untuk aplikasi (Windows: .ico, macOS: .icns, Linux: .png)
const appIcon = getIconPath('LOGOCOBA', 'ico') || getIconPath('LOGO_CAREIT', 'ico');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: "out/**/*", // Unpack folder out dari asar agar static files bisa diakses
    },
    // Copy folder out ke resources directory agar bisa diakses saat runtime
    // Format: array of strings (relative path dari project root)
    extraResource: [
      './out',
    ],
    name: 'CareIt',
    executableName: 'CareIt',
    ...(appIcon && { icon: appIcon }), // Hanya set icon jika file ada
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'CareIt',
        authors: 'CareIt Development Team',
        description: 'CareIt - Aplikasi Billing dan Manajemen Rumah Sakit',
        // Setup icon untuk installer Windows (.ico file)
        // Hanya set jika file .ico ada dan valid
        ...(getIconPath('LOGOCOBA', 'ico') && { 
          setupIcon: getIconPath('LOGOCOBA', 'ico') 
        }),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
