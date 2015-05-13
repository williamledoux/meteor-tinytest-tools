Package.describe({
  summary: "Helpers for Meteor's tinytest",
  internal: false,
  version: "0.2.0",
  name: "williamledoux:tinytest-tools",
  git: "https://github.com/williamledoux/meteor-tinytest-tools.git"
});

Package.onUse(function (api){
  api.versionsFrom('0.9.0');
  api.use('tinytest');
  api.export('CallbacksWatcher', {testOnly: true});
  api.add_files('callbacks_watcher.js');
});