<?php
namespace App\Providers;

use DB;
use Illuminate\Support\ServiceProvider;
use App\Models\Common;

class ViewComposerServiceProvider extends ServiceProvider
{
    public function boot()
    {
        view()->composer('frontend.layouts.header', function($view) {
            $menu_data = Common::getMarketplaceTreeData();
            $view->with('menu_data', $menu_data);
        });
    }
}