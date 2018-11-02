<?php

namespace App\Http\Controllers\Backend;

use App\Models\Base\SportsPlayer;
use App\Models\Base\SportsTeam;
use App\Models\Base\SportsType;
use App\Models\TransactionHistory;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Celebrity;

class MassImportController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        return view('backend.base.massimport');
    }

    public function importMass(Request $request){
        $arr = array();
        $type_arr = array();
        $team_arr = array();
        $player_arr = array();

        if($request->hasFile('mass_file')){
            $path = $request->file('mass_file')->getRealPath();
            $data = \Excel::load($path)->get();
            $head_arr = \Excel::load($path)->all()->first()->keys()->toArray();
            if($data->count()){
                foreach ($data as $key => $value) {
                    if (is_null($value->type) || $value->type=='') continue;
                    $player_arr[$value->type][$value->team][] = $value->player;
                }
                foreach( $player_arr as $type=>$_team_arr ) {
                    $type_arr[] = $type;
                    $team_arr[$type] = array_keys($_team_arr);
                }
            }
        }
//        $url = str_replace(' ', '%20', $data[0]->avatar_image_link);

        ini_set('max_execution_time', '20000');
        SportsType::truncate();
        foreach ( $type_arr as $type) {
            $type_record = new SportsType();
            $type_record->type_name = $type;
            $type_record->save();
            $new_type[$type] = $type_record->id;
        }
        SportsTeam::truncate();
        foreach ( $team_arr as $type=>$team_ar ) {
            foreach( $team_ar as $team ) {
                $team_record = new SportsTeam();
                $team_record->sports_type_id = $new_type[$type];
                if ( $team == "" ) {
                    $teamStr = "Top ".count($player_arr[$type][$team]). " players";
                }
                else {
                    $teamStr = $team;
                }
                $team_record->team_name = $teamStr;
                $team_record->save();
                $new_team[$team] = $team_record->id;
            }
        }
        if ( $data->count() ) {
            SportsPlayer::truncate();
            foreach( $data as $key=>$value ) {
                if (is_null($value->type) || $value->type=='') continue;
                $player_record = new SportsPlayer();
                $player_record->team_id = $new_team[$value->team];
                $player_record->player_name = $value->player;
                $player_record->save();
                $new_player[$value->player] = $player_record->id;
            }
        }
        if ( $data->count() ) {
            Celebrity::truncate();
            foreach( $data as $key=>$value ) {
                if (is_null($value->type) || $value->type=='') continue;
//                $this->image_save_from_url($value->avatar_image_link);
                ( isset($value->price) ) ? $price = $value->price*1 : $price = 0.001;
                ( isset($value->ranking) ) ? $ranking = $value->ranking : $ranking = '';
                ( isset($value->changes) ) ? $changes = $value->changes : $changes = '';
                $athlete_record = new Celebrity();
                $athlete_record->player_id = $new_player[$value->player];
                $athlete_record->avatar_image_name = 'default.png';//basename($value->avatar_image_link);
                $athlete_record->price = $price;
                $athlete_record->purchase_price = $price;
                $athlete_record->origin_wallet_id = $value->orgin_wallet_id;
                $athlete_record->send_fee = $value->send_fee;
                $athlete_record->site_fee = $value->site_fee;
                $athlete_record->ranking = $ranking;
                $athlete_record->changes = $changes;
                $athlete_record->owner_id = \Auth::user()->id;
                if ( isset($value->is_published) ) {
                    if ( !is_null($value->is_published) )
                        $athlete_record->is_published = $value->is_published;
                    else
                        $athlete_record->is_published = 0;
                }
                else $athlete_record->is_published = 0;
                $athlete_record->mass = '';
                $athlete_record->save();
//                $new_player[$value->player] = $player_record->id;
            }

            TransactionHistory::truncate();
        }

        return redirect()->route('showcelebrityeditor');
    }
    private function image_save_from_url($my_img){
        $fullpath = "upload/athlete/avatar/".basename($my_img);
        $my_img = str_replace(' ', '%20', $my_img);
        $ch = curl_init($my_img);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_BINARYTRANSFER,1);
        curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 1);
        $rawdata=curl_exec($ch);
        curl_close ($ch);
        if(file_exists($fullpath)){
            unlink($fullpath);
        }
        $fp = fopen($fullpath,'x');
        fwrite($fp, $rawdata);
        fclose($fp);
    }
    /**

     * Create a new controller instance.

     *

     * @return void

     */

    public function exportFile($type){

        $products = Product::get()->toArray();



        return \Excel::create('hdtuto_demo', function($excel) use ($products) {

            $excel->sheet('sheet name', function($sheet) use ($products)

            {

                $sheet->fromArray($products);

            });

        })->download($type);

    }
}
