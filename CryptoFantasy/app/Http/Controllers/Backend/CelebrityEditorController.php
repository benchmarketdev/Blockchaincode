<?php

namespace App\Http\Controllers\Backend;

use App\Models\Celebrity;
use App\Models\Common;
use App\Http\Controllers\Controller;
use App\Models\Base\SportsPlayer;
use App\Models\Base\SportsType;
use App\Models\Base\SportsTeam;

use App\Models\EthLibrary;

use EthereumPHP\EthereumClient;
use EthereumPHP\Types\BlockHash;
use EthereumPHP\Types\BlockNumber;
use App\Models\BaseEthProvider;

class CelebrityEditorController extends Controller
{
    //
    private $ext;
    public function __construct() {
        $this->middleware('auth');
    }
    public function index() {
        $typedata = SportsType::all()->toArray();
        $teamModel = new SportsTeam();
        $playerModel = new SportsPlayer();
        $treeData = array();
        foreach( $typedata as $type ) {
            $tree_data = ['id'=>$type['_id'], 'text'=>$type['type_name'], 'expanded'=>true];
            $teamData = $teamModel->getTeamDataByType($type['_id']);
            $_teamData = [];
            foreach( $teamData as $team ) {
                $playerData = $playerModel->getPlayerListByTeam($team['_id']);
                $_team = ['id'=>$team['_id'], 'text'=>$team['team_name'], 'expanded'=>true];
                foreach( $playerData as $player ) {
                    $_team['items'][] = ['id'=>$player['_id'], 'text'=>$player['player_name'], 'expanded'=>true];
                }
                $_teamData[] = $_team;
            }
            $tree_data['items'] = $_teamData;
            $treeData[] = $tree_data;
        }

        return view('backend.celebrity.editor')->with(['tree_data'=>json_encode($treeData)]);
    }
    public function indexWithFilterKey() {
        $search_keyword = request()->get('search_keyword');
        var_dump($search_keyword);
        $typedata = SportsType::all()->toArray();
        $teamModel = new SportsTeam();
        $playerModel = new SportsPlayer();
        $treeData = array();
        foreach( $typedata as $type ) {
            $tree_data = $type;
            $teamData = $teamModel->getTeamDataByType($type['_id']);
            $_teamData = [];
            foreach( $teamData as $team ) {
                $playerData = $playerModel->getPlayerListByTeam($team['_id']);
                $team['player_list'] = $playerData;
                $_teamData[] = $team;
            }
            $tree_data['team_data'] = $_teamData;
            $treeData[] = $tree_data;
        }
        return view('backend.celebrity.editor')->with(['tree_data'=>$treeData]);
    }
    public function cropImage() {
        $post = isset($_POST) ? $_POST : array();
        switch ($post['action']) {
            case 'save' :
                $this->saveProfilePic();
                $this->saveProfilePicTmp();
                break;
            default:
                $this->changeProfilePic();
        }
    }
    /* Function to change profile picture */
    function changeProfilePic() {
        $post = isset($_POST) ? $_POST: array();
        $max_width = "500";
        $userId = isset($post['sports_player_id']) ? $post['sports_player_id'] : 0;
        $path = 'upload/celebrities/avatar';
        $destinationPath = public_path($path);
        if (!file_exists($destinationPath)) {
            \File::makeDirectory($destinationPath, 0777, true);
        }
        $valid_formats = array("jpg", "png", "gif", "jpeg");
        $name = $_FILES['profile-pic']['name'];
        $size = $_FILES['profile-pic']['size'];
        $path_parts = pathinfo($_FILES["profile-pic"]["name"]);
        $this->ext = $path_parts['extension'];
        if(strlen($name)) {
            if(in_array($this->ext,$valid_formats)) {
                $actual_image_name = 'avatar' .'_'.$userId .'.'.$this->ext;
                $filePath = $path .'/'.$actual_image_name;
                $tmp = $_FILES['profile-pic']['tmp_name'];
                if(move_uploaded_file($tmp, $filePath)) {
                    $width = $this->getWidth($filePath);
                    $height = $this->getHeight($filePath); //Scale the image if it is greater than the width set above if ($width > $max_width){
                    $scale = $max_width/$width;
                    $uploaded = $this->resizeImage($filePath,$width,$height,$scale, $this->ext);
                } else {
                    $width = $this->getWidth($filePath);
                    $height = $this->getHeight($filePath);
                    $scale = 1;
                    $uploaded = $this->resizeImage($filePath,$width,$height,$scale, $this->ext);
                }
                echo "<img id='photo' file-name='".$actual_image_name."' class='' src='../".$filePath.'?'.time()."' class='preview'/>";
            }
            else
                echo "Image file size max 1 MB";
        }
        else
            echo "Invalid file format..";
    }
    /* Function to update image */
    function saveProfilePicTmp() {
        $post = isset($_POST) ? $_POST: array();
        $userId = isset($post['id']) ? $post['id'] : 0;
        $path = 'upload/celebrities/avatar';
        $destinationPath = public_path($path);
        if (!file_exists($destinationPath)) {
            \File::makeDirectory($destinationPath, 0777, true);
        }
        $t_width = 600; // Maximum thumbnail width
        $t_height = 600; // Maximum thumbnail height
        if(isset($_POST['t']) and $_POST['t'] == "ajax") {
            extract($_POST);
            $imagePath = $path.'/'.$_POST['image_name'];
            $ratio = ($t_width/$post['w1']);
            $nw = ceil($post['w1'] * $ratio);
            $nh = ceil($post['h1'] * $ratio);
            $nimg = imagecreatetruecolor($nw,$nh);
            $im_src = imagecreatefromjpeg($imagePath);
            imagecopyresampled($nimg,$im_src,0,0,$post['x1'],$post['y1'],$nw,$nh,$post['w1'],$post['h1']);
            imagejpeg($nimg,$imagePath,90);
        }
        echo '../'.$imagePath.'?'.time();;
        exit(0);
    }
    /* Function to resize image */
    function resizeImage($image,$width,$height,$scale) {
        $newImageWidth = ceil($width * $scale);
        $newImageHeight = ceil($height * $scale);
        $newImage = imagecreatetruecolor($newImageWidth,$newImageHeight);
        switch ($this->ext) {
            case 'jpg':
            case 'jpeg':
                $source = imagecreatefromjpeg($image);
                break;
            case 'gif':
                $source = imagecreatefromgif($image);
                break;
            case 'png':
                $source = imagecreatefrompng($image);
                break;
            default:
                $source = false;
                break;
        }
        imagecopyresampled($newImage,$source,0,0,0,0,$newImageWidth,$newImageHeight,$width,$height);
        imagejpeg($newImage,$image,90);
        chmod($image, 0777);
        return $image;
    }
    /* Function to get image height. */
    function getHeight($image) {
        $sizes = getimagesize($image);
        $height = $sizes[1];
        return $height;
    }
    /* Function to get image width */
    function getWidth($image) {
        $sizes = getimagesize($image);
        $width = $sizes[0];
        return $width;
    }
    function saveProfilePic(){
        $model = new Celebrity();
        $player_id = request()->get('id');
        $avatar_image_name = request()->get('image_name');

        $data = $model->where('player_id', $player_id)->first();
        if ( $data ){
            $data->player_id = $player_id;
            $data->avatar_image_name = $avatar_image_name;
            $data->save();
        }
        else{
            $model->player_id = $player_id;
            $model->avatar_image_name = $avatar_image_name;
            $model->save();
        }
    }

    public function getCelebrityInfo($player_id) {
        $model = new Celebrity();
        $data = $model->where('player_id', $player_id)->first();
        $ret = array('result'=>'fail');
        if ( $data ) {
            $ret['result'] = 'success';
            $ret['data'] = Common::getCelebrityDetailInfo($player_id);
        }
        return response()->json($ret);
    }
    public function setCelebrityDetailInfo($player_id) {
        $model = new Celebrity();
        $data = $model->where('player_id', $player_id)->first();
        if ( $data ) $model = $data;
        $model->player_id = $player_id;
        $model->price = request()->get('price')*1;
        $model->origin_wallet_id = request()->get('origin_wallet_id');
        $model->send_fee = request()->get('send_fee')*1;
        $model->site_fee = request()->get('site_fee')*1;
        ( request()->get('is_published') == 'on' ) ? $model->is_published = 1 : $model->is_published = 0;
        if (!is_null(request()->get('mass'))) $model->mass = request()->get('mass');
        $model->save();
        return 'ok';
    }
    public function showAthleteCreate() {
        $model = new BaseEthProvider();
        $provider = $model->all()->first()->toArray();
        $athlete_datas = Common::getCelebrityDetailInfo();
        return view('backend.celebrity.athletecreate')->with(['athlete_datas'=>$athlete_datas, 'provider'=>$provider]);
    }
    public function removeAllAthlete() {
        $datas = app(Celebrity::class)->whereNotNull('token_id')->get();
        if ( $datas ) {
            foreach( $datas as $data ) {
                $data->unset('token_id');
                $data->unset('card_status');
                $data->unset('transactions');
            }
        }
        return 'ok';
    }
}
