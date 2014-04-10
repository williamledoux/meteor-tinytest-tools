Package.describe({
  summary: "Tools for TinyTest",
  internal: false,
  environments: ['client', 'server']
});

Package.on_use(function (api){
  api.use('tinytest');
  api.export('CallbacksWatcher', {testOnly: true});
  api.add_files('callbacks_watcher.js');
});