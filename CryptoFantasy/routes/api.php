<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

Route::group(['prefix' => 'v1/public', 'namespace' => 'Frontend'], function () {

});
Route::group(['prefix' => 'v1/public', 'namespace' => 'Backend'], function () {
    Route::get('/marketplacemenu', 'ApiController@getMarketplaceMenu');
    Route::get('/viewathlete/{team_id}', 'ApiController@viewAthlete');
    Route::get('/setathletetokenid/{athlete_id}', 'ApiController@setAthleteToTokenId');
    Route::get('/getethprovider', 'ApiController@getEthProviderConfig');
});
