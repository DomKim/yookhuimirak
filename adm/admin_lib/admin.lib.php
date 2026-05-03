<?php
if (!defined('_GNUBOARD_')) exit;

// 관리자 페이지 추가 라이브러리


// 파일을 업로드 함
/*function upload_file($srcfile, $destfile, $dir)
{
    if ($destfile == "") return false;
    // 업로드 한후 , 퍼미션을 변경함
    @move_uploaded_file($srcfile, $dir.'/'.$destfile);
    @chmod($dir.'/'.$destfile, G5_FILE_PERMISSION);
    return true;
}*/

// 관리자 경로지정
function is_adm_page(){
  $is_adm_page = parse_url($_SERVER['PHP_SELF']);
  if(strpos($is_adm_page['path'], '/adm/') !== false) {
    return true;
  }
}


function get_adminlist($write_row, $board, $skin_url, $subject_len=40)
{
    global $g5, $config;
    global $qstr, $page;

    //$t = get_microtime();

    // 배열전체를 복사
    $list = $write_row;
    unset($write_row);

    $board_notice = array_map('trim', explode(',', $board['bo_notice']));
    $list['is_notice'] = in_array($list['wr_id'], $board_notice);

    if ($subject_len)
        $list['subject'] = conv_subject($list['wr_subject'], $subject_len, '…');
    else
        $list['subject'] = conv_subject($list['wr_subject'], $board['bo_subject_len'], '…');

    // 목록에서 내용 미리보기 사용한 게시판만 내용을 변환함 (속도 향상) : kkal3(커피)님께서 알려주셨습니다.
    if ($board['bo_use_list_content'])
	{
		$html = 0;
		if (strstr($list['wr_option'], 'html1'))
			$html = 1;
		else if (strstr($list['wr_option'], 'html2'))
			$html = 2;

        $list['content'] = conv_content($list['wr_content'], $html);
	}

    $list['comment_cnt'] = '';
    if ($list['wr_comment'])
        $list['comment_cnt'] = "<span class=\"cnt_cmt\">".$list['wr_comment']."</span>";

    // 당일인 경우 시간으로 표시함
    $list['datetime'] = substr($list['wr_datetime'],0,10);
    $list['datetime2'] = $list['wr_datetime'];
    if ($list['datetime'] == G5_TIME_YMD)
        $list['datetime2'] = substr($list['datetime2'],11,5);
    else
        $list['datetime2'] = substr($list['datetime2'],5,5);
    // 4.1
    $list['last'] = substr($list['wr_last'],0,10);
    $list['last2'] = $list['wr_last'];
    if ($list['last'] == G5_TIME_YMD)
        $list['last2'] = substr($list['last2'],11,5);
    else
        $list['last2'] = substr($list['last2'],5,5);

    $list['wr_homepage'] = get_text($list['wr_homepage']);

    $tmp_name = get_text(cut_str($list['wr_name'], $config['cf_cut_name'])); // 설정된 자리수 만큼만 이름 출력
    $tmp_name2 = cut_str($list['wr_name'], $config['cf_cut_name']); // 설정된 자리수 만큼만 이름 출력
    if ($board['bo_use_sideview'])
        $list['name'] = get_sideview($list['mb_id'], $tmp_name2, $list['wr_email'], $list['wr_homepage']);
    else
        $list['name'] = '<span class="'.($list['mb_id']?'sv_member':'sv_guest').'">'.$tmp_name.'</span>';

    $reply = $list['wr_reply'];

    $list['reply'] = strlen($reply)*20;

    $list['icon_reply'] = '';
    if ($list['reply'])
        $list['icon_reply'] = '<img src="'.$skin_url.'/img/icon_reply.gif" class="icon_reply" alt="답변글">';

    $list['icon_link'] = '';
    if ($list['wr_link1'] || $list['wr_link2'])
        $list['icon_link'] = '<i class="fa fa-link" aria-hidden="true"></i> ';

    // 분류명 링크
    $list['ca_name_href'] = G5_ADMIN_URL.'/design_admin/bbs/board.php?bo_table='.$board['bo_table'].'&amp;sca='.urlencode($list['ca_name']);

    $list['href'] = G5_ADMIN_URL.'/design_admin/bbs/board.php?bo_table='.$board['bo_table'].'&amp;wr_id='.$list['wr_id'].$qstr;
    $list['comment_href'] = $list['href'];

    $list['icon_new'] = '';
    if ($board['bo_new'] && $list['wr_datetime'] >= date("Y-m-d H:i:s", G5_SERVER_TIME - ($board['bo_new'] * 3600)))
        $list['icon_new'] = '<img src="'.$skin_url.'/img/icon_new.gif" class="title_icon" alt="새글"> ';

    $list['icon_hot'] = '';
    if ($board['bo_hot'] && $list['wr_hit'] >= $board['bo_hot'])
        $list['icon_hot'] = '<i class="fa fa-heart" aria-hidden="true"></i> ';

    $list['icon_secret'] = '';
    if (strstr($list['wr_option'], 'secret'))
        $list['icon_secret'] = '<i class="fa fa-lock" aria-hidden="true"></i> ';

    // 링크
    for ($i=1; $i<=G5_LINK_COUNT; $i++) {
        $list['link'][$i] = set_http(get_text($list["wr_link{$i}"]));
        $list['link_href'][$i] = G5_BBS_URL.'/link.php?bo_table='.$board['bo_table'].'&amp;wr_id='.$list['wr_id'].'&amp;no='.$i.$qstr;
        $list['link_hit'][$i] = (int)$list["wr_link{$i}_hit"];
    }

    // 가변 파일
    if ($board['bo_use_list_file'] || ($list['wr_file'] && $subject_len == 255) /* view 인 경우 */) {
        $list['file'] = get_file($board['bo_table'], $list['wr_id']);
    } else {
        $list['file']['count'] = $list['wr_file'];
    }

    if ($list['file']['count'])
        $list['icon_file'] = '<i class="fa fa-download" aria-hidden="true"></i> ';

    return $list;
}

?>
