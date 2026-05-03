<?php
if(!defined("_GNUBOARD_")) exit;

if($w == ''){

	$watermark_img = G5_THEME_PATH."/act/watermark.gif";
	if (file_exists($watermark_img))
	{

		//워터마크 체크할 파일 인클루드
		include_once(G5_LIB_PATH.'/image_proc.function.php');

		$content_por = sql_fetch("select * from g5_write_".$bo_table." where wr_id = '$wr_id' ");

		$contents = $content_por[wr_content];
		preg_match_all('@<img\s+.*?(src\s*=\s*("[^"\\\\]*(?:[^"\\\\]*)*"|\'[^\'\\\\]*(?:[^\'\\\\]*)*\'|[^\s]+)).*?>@is', $contents, $match);
		$wtm_count =  count($match[1]);
		for ($k=0; $k <= $wtm_count; $k++ ) {
		$marks[$k] = str_replace('"',"",$match[1][$k]);
		$marks_image[$k] = str_replace(' /',"",$marks[$k]);
		$imgSize[$k] = @GetImageSize($marks_image[$k]);

		$imgWidth[] = $imgSize[$k][0];
		$imgHeight[] = $imgSize[$k][1];
		$image[] = str_replace("src=","",$marks_image[$k]);
		$image_name[] = explode("/",$image[$k]);

		}
		for($j=0; $j<=$wtm_count; $j++) {
		$exp = $image_name[$j][6];//원본파일
		$exp_img = explode(".",$exp);
		//확장자가 이미지 일때만
		if ($exp_img[1] == "jpg" or $exp_img[1] == "png" or $exp_img[1] == "gif" or $exp_img[1] == "jpeg" or $exp_img[1] == "JPG" or $exp_img[1] == "PNG" or $exp_img[1] == "GIF" or $exp_img[1] == "JPEG") {
		$path_file = G5_PATH.'/data/editor/'.$image_name[$j][5]."/".$image_name[$j][6];//원본파일
		//$path_mark_file = G5_PATH.'/img/wtm.gif';//워터마크에 사용할 파일
		$path_mark_file = G5_THEME_PATH.'/act/watermark.gif';//워터마크에 사용할 파일

		$path_save_top_right_file = G5_PATH.'/data/editor/'.$image_name[$j][5]."/".$image_name[$j][6]; //워터마크 처리한 것을 원본에 덮어씌움

		//원본의 이미지 리소스를 받아온다.
		list($src, $src_w, $src_h) = get_image_resource_from_file ($path_file);
		if (empty($src)) die($GLOBALS['errormsg'] . "<br />\n");

		//워터마크에 사용될 이미지 리소스를 받아온다.
		list($mark, $mark_w, $mark_h) = get_image_resource_from_file ($path_mark_file);
		if (empty($mark)) die($GLOBALS['errormsg'] . "<br />\n");

		//원본을 5 분의 1로 축소한 너비와 높이를 구한다.
		$src_w_small = $src_w; //리사이징 제거함
		$src_h_small = get_size_by_rule($src_w, $src_h, $src_w_small);

		//원본의 상단 오른쪽을 기준으로 선명도 100으로 워터마크 처리
		if ($src_w > 200) { //width가 200 이하인 이미지는 워터마크 처리안함
		$src2 = get_image_resize($src, $src_w, $src_h, $src_w_small, $src_h_small);
		if (empty($src2)) die($GLOBALS['errormsg'] . "<br />\n");


		$src2_x = $src_w_small - $mark_w;
		$src2_y = 0;

		//padding 을 10px 씩 줘야 하므로 x좌표는 왼쪽으로 10 이동 y좌표는 아래로 10 이동
		$src2_x -= 0;
		$src2_y += 0;

		//워터마크는 투명도 50으로 설정
		$result_watermark = imagecopymerge($src2, $mark, $src2_x, $src2_y, 0, 0, $mark_w, $mark_h, 50);
		if ($result_watermark === false) die("워터마크 처리에 실패하였습니다.<br />\n");

		$result_save = save_image_from_resource ($src2, $path_save_top_right_file, 100, 2);//저장
		if ($result_save === false) die($GLOBALS['errormsg'] . "<br />\n");

		@imagedestroy($src2);
				}
			}
		}
	}

}

if($form_filed['board']){
  $extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
  WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = 'g5_write_".$form_filed[board]."'
  AND COLUMN_NAME
  NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
  $cnt = sql_fetch($extend_column);
  $filedCount = $cnt['cnt'];
}else{
  $filedCount = 10;
}

for ($i=1; $i <= $filedCount; $i++) {
  $addQuery .= 'wr_'.$i.' = "'.${wr_.$i}.'", ';
}
$addQuery = substr($addQuery, 0, -2);

// 추가필드 데이터 저장하기.
$sql = "update $write_table
          set ".$addQuery." where wr_id = '$wr_id'";

sql_query($sql);
?>
