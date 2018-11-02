let mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.less('resources/assets/less/fileupload.less', 'public/css')
   .less('resources/assets/less/table.less', 'public/css')
   .react('resources/assets/js/app.js', 'public/js')
   .react('resources/assets/js/Blockchain/Blockchain.js', 'public/js')
   .sass('resources/assets/sass/app.scss', 'public/css');
