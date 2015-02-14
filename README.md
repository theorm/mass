# Angular + Gulp + Less seed

Speeding up spinning new projects with Angular, Gulp, Less and a modular design.

## Notes

 Make sure angular module name matches the name of bower.json. It is used for creating template cache.

 If you are writing a module, put all templates into a subfolder in `src/views` directory:
 ```
  src/views/mymodule/
    template1.html
    template2.html
 ```

 In a modular application this will ensure that template names do not clash in the cache.


 Application stylesheet entry point is `app.less`. It is configured in `gulpfile.config.js`.