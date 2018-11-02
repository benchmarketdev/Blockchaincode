<?php

namespace App\Http\Controllers\Backend;

use App\Models\Base\SportsPlayer;
use App\Models\Base\SportsType;
use App\Models\Common;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Base\SportsTeam;

class BaseController extends Controller
{
    //
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        return view('backend.base.editbasedata');
    }
    public function showSportsTypeForm() {
        $data = SportsType::all();
        if ( $data ) $data = $data->toArray();
        return view('backend.base.editsportstype')->with(['data'=>$data]);
    }
    public function storeSportsTypeForm() {
        $sports_type=  request()->get('sports_type');
        $_id=  request()->get('_id');
        if ( is_null($_id) ) {
            $model = new SportsType();
            $model->type_name = $sports_type;
            $model->save();
        }
        else {
            $model = new SportsType();
            $data = $model->where('_id', $_id)->first();
            $data->type_name = $sports_type;
            $data->save();
        }
        return redirect()->route('editsportstype');
    }
    public function deleteSportsType($id) {
        $model = new SportsType();
        $model->where('_id', $id)->delete();
    }
    public function showSportsTeamForm() {
        $data = SportsType::all();
        if ( $data ) $data = $data->toArray();
        $team_data = [];
        return view('backend.base.editsportsteam')->with(['data'=>$data, 'team_data'=>$team_data]);
    }
    public function showSportsTeam($sports_type_id) {
        $data = SportsType::all();
        if ( $data ) $data = $data->toArray();
        $team_data = [];
        $teamData = SportsTeam::where('sports_type_id', $sports_type_id)->get();
        $team_data = $teamData->toArray();
        return view('backend.base.showsportsteam')->with(['data'=>$data, 'team_data'=>$team_data,'sports_type_id'=>$sports_type_id]);
    }
    public function showSportsTeamFormData($sports_type_id) {
        $team_data = [];
        if ( !is_null($sports_type_id) ) {
            $teamData = SportsTeam::where('sports_type_id', $sports_type_id)->get();
            $team_data = $teamData->toArray();
        }
        return response()->json(['data'=>$team_data,'sports_type_id'=>$sports_type_id]);
    }
    public function storeSportsTeamFormData() {
        $sports_type_id =  request()->get('sports_type_id');
        $team_name =  request()->get('team_name');
        $_id=  request()->get('_id');
        if ( is_null($_id) ) {
            $model = new SportsTeam();
            $model->team_name = $team_name;
            $model->sports_type_id = $sports_type_id;
            $model->save();
        }
        else {
            $model = new SportsTeam();
            $data = $model->where('_id', $_id)->first();
            $data->team_name = $team_name;
            $data->sports_type_id = $sports_type_id;
            $data->save();
        }
        return redirect()->route('showsportsteam', ['sports_type_id'=>$sports_type_id]);
    }
    public function deleteSportsTeam($id) {
        $model = new SportsTeam();
        $model->where('_id', $id)->delete();
    }
    public function showPlayerEditor() {
        $typedata = SportsType::all()->toArray();
        $teamModel = new SportsTeam();
        $treeData = array();
        foreach( $typedata as $type ) {
            $tree_data = $type;
            $teamData = $teamModel->getTeamDataByType($type['_id']);
            $tree_data['team_data'] = $teamData;
            $treeData[] = $tree_data;
        }
        return view('backend.base.showplayereditor')->with(['tree_data'=>$treeData]);
    }
    public function storeSportsPlayer() {
        $team_id =  request()->get('team_id');
        $player_name =  request()->get('player_name');
        $_id=  request()->get('_id');
        $model = new SportsPlayer();
        if ( is_null($_id) ) {
            $model->team_id = $team_id;
            $model->player_name = $player_name;
            $model->save();
        }
        else {
            $data = $model->where('_id', $_id)->first();
            $data->team_id = $team_id;
            $data->player_name = $player_name;
            $data->save();
        }
        return 'ok';
    }
    public function getPlayerInfo($team_id) {
        $model = new SportsPlayer();
        $data = $model->where('team_id', $team_id)->get();
        $ret = [];
        if ( $data )$ret = $data->toArray();
        return response()->json($ret);
    }
    public function deleteSportsPlayer($id) {
        $model = new SportsPlayer();
        $model->where('_id', $id)->delete();
    }
}
