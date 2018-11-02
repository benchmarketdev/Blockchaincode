<?php

use App\Events\MessagePosted;

//Route::get('/', function () {
////    dd(\App\Models\User::all()->toArray());
////    return view('welcome');
//});
Route::get('/', 'IndexController@index');
Route::post('/registermanager', 'RegisterManagerController@registerManager')->name('registermanager');

Route::get('/messages', 'Frontend\UserController@getMessages');
Route::get('/sendmessage', 'Frontend\UserController@createMessage');

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');
Route::get('getmarketplacemenu', 'Frontend\MarketplaceController@getMarketplaceMenu')->name('marketplace.menu');
Route::get('/account', 'Frontend\UserController@index')->name('account');
Route::post('/changeusername', 'Frontend\UserController@changeUsername')->name('change.username');
Route::post('/withdraw', 'Frontend\UserController@withdraw')->name('withdraw');
Route::get('/account', 'Frontend\UserController@index')->name('account');

Route::group(['prefix' => '/', 'namespace' => 'Frontend'], function() {
    Route::get('showbuycontract/{athlete_id}', 'BuyContractController@showPendingForm')->name('show.buy.contract');
//    Route::post('/buycontract/{athlete_id}', 'BuyContractController@buyContract');
    Route::get('marketplace', 'MarketplaceController@index')->name('marketplace');
    Route::get('marketplace/{team_id}', 'MarketplaceController@viewAthlete')->name('marketplace');
    Route::get('/userathlete/{user_id}', 'MarketplaceController@showAthleteInfoByUser')->name('user.athlete');
    Route::get('/athlete/{athlete_id}', 'MarketplaceController@showDetailsForAthlete')->name('athlete');
    Route::get('/search', 'MarketplaceController@searchPlayers');

    Route::get('/buycontract/{athlete_id}', 'BuyContractController@buyContract');
    Route::get('/setathletestatustopending/{athlete_id}', 'BuyContractController@setAthleteStatusToPending');
    Route::post('/pending/{athlete_id}', 'BuyContractController@showPendingForm');

    Route::get('/dashboard', 'DashboardController@index')->name('dashboard');
    Route::get('/transaction', 'DashboardController@transactionview')->name('transaction');
    Route::get('/accountbalance', 'UserController@getUserAssetbalance')->name('account.balance');
    Route::get('/accountinfo', 'UserController@getAuthUserInfo')->name('account.info');
    Route::post('/changeathleteprice', 'UserController@changeAthletePrice')->name('changeathleteprice');
    Route::get('/myathlete/{athlete_id}', 'UserController@showDetailsForAthlete')->name('myathlete');
    Route::post('/uploadathletephoto', 'UserController@uploadAthletePhoto')->name('upload.athletephoto');
});



Route::group(['prefix' => 'admin', 'namespace' => 'Backend'], function(){
    Route::get('adminpanel', 'BaseController@index')->name('adminpanel');

    Route::get('massimport', 'MassImportController@index')->name('mass.import.view');
    Route::post('import-file', 'MassImportController@importMass')->name('import.mass');

    Route::get('editsportstype', 'BaseController@showSportsTypeForm')->name('editsportstype');
    Route::get('deletesportstype/{id}', 'BaseController@deleteSportsType')->name('deletesportstype');
    Route::post('editsportstype', 'BaseController@storeSportsTypeForm')->name('editsportstype');

    Route::get('editsportsteam', 'BaseController@showSportsTeamForm')->name('editsportsteam');
    Route::get('showsportsteam/{sports_type_id}', 'BaseController@showSportsTeam')->name('showsportsteam');
    Route::get('editsportsteamdata/{sports_id}', 'BaseController@showSportsTeamFormData')->name('editsportsteamdata');
    Route::post('editsportsteam', 'BaseController@storeSportsTeamFormData')->name('editsportsteam');
    Route::get('deletesportsteam/{id}', 'BaseController@deleteSportsTeam')->name('deletesportsteam');

    Route::get('showplayereditor', 'BaseController@showPlayerEditor')->name('showplayereditor');
    Route::post('storesportsplayer', 'BaseController@storeSportsPlayer')->name('storesportsplayer');
    Route::get('getplayerinfo/{team_id}', 'BaseController@getPlayerInfo')->name('getplayerinfo');
    Route::get('deletesportsplayer/{_id}', 'BaseController@deleteSportsPlayer')->name('deletesportsplayer');

    Route::get('showcelebrityeditor', 'CelebrityEditorController@index')->name('showcelebrityeditor');
    Route::post('showcelebrityeditorfilter', 'CelebrityEditorController@indexWithFilterKey')->name('showcelebrityeditorfilter');
    Route::post('cropimage', 'CelebrityEditorController@cropImage')->name('cropimage');
    Route::get('getcelebrityinfo/{player_id}', 'CelebrityEditorController@getCelebrityInfo')->name('getcelebrityinfo');
    Route::post('setcelebritydetailinfo/{player_id}', 'CelebrityEditorController@setCelebrityDetailInfo')->name('setcelebritydetailinfo');
    Route::get('showathletecreate', 'CelebrityEditorController@showAthleteCreate')->name('show.athlete.create');
    Route::get('removeallathlete', 'CelebrityEditorController@removeAllAthlete')->name('remove.all.athlete');

    Route::get('showtransaction', 'TransactionController@index')->name('show.transaction.form');
    Route::get('showmember', 'MemberController@index')->name('show.member.form');
    Route::get('showethprovider', 'EthProviderController@index')->name('show.provider.form');
    Route::post('storeethprovider', 'EthProviderController@storeProviderInfo')->name('store.provider');
});