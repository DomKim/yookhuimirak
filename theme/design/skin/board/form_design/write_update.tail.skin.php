<?php
if (!defined("_GNUBOARD_")) exit;//개별 페이지 접근 불가

if($form_filed[wr_sms_type]=='L'){
  include_once(G5_LIB_PATH.'/icode.lms.lib.php');
}else{
  include_once(G5_LIB_PATH.'/icode.sms.lib.php');
}
// 글작성 했던 페이지로 이동.
if($bo_table == $form_filed[board]){

  // SMS전송 사용할 경우.
  if($form_filed[wr_sms_check] == 'y'){
    $send_hp_mb = $form_filed[wr_sms_send]; // 보내는 전화번호
    $recv_hp_mb = $form_filed[wr_sms_recv]; //  받는 전화번호

    $send_hp = str_replace("-","",$send_hp_mb); // - 제거
    $recv_hp = str_replace("-","",$recv_hp_mb); // - 제거

    $send_number =  "$send_hp";
    $recv_number = "$recv_hp";

    if($form_filed[wr_sms_type]=='L'){
      $strDest = array();
      $strDest[0] = $recv_number;
    }

    if($form_filed[wr_sms_type]=='L'){
      $sms_content = $wr_name." 님이 ".$wr_subject." 신청 하셨습니다.\n ".G5_BBS_URL.'/board.php?bo_table='.$bo_table.'&wr_id='.$wr_id;  // 문자 내용
    }else{
      $sms_content = $wr_name." 님이 ".$wr_subject." 신청 하셨습니다.";  // 문자 내용
    }

    if($form_filed[wr_sms_type]=='L'){
      // 긴문자 전송시
      $SMS = new LMS; // SMS 연결
      $SMS->SMS_con($config['cf_icode_server_ip'], $config['cf_icode_id'], $config['cf_icode_pw'], '1');
      $SMS->Add($strDest, $send_number, $config['cf_icode_id'],"","", iconv("utf-8", "euc-kr", stripslashes($sms_content)), "","1");
      $SMS->Send();
    }else{
      // 단문자 전송시
      $SMS = new SMS; // SMS 연결
      $SMS->SMS_con($config['cf_icode_server_ip'], $config['cf_icode_id'], $config['cf_icode_pw'], $config['cf_icode_server_port']);
      $SMS->Add($recv_number, $send_number, $config['cf_icode_id'], iconv("utf-8", "euc-kr", stripslashes($sms_content)), "");
      $SMS->Send();
    }

  }

  // 완료문구
  if($form_filed[form_success_info]){
    alert($form_filed[form_success_info]);
  }else{
    alert('접수가 완료되었습니다.');
  }
    goto_url($_SERVER["HTTP_REFERER"]);
}

?>
