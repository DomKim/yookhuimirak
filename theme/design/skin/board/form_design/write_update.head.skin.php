<?php
// 접수폼 관련정보
include('form.lib.php');

// select 배열을 db로 저장.
for($i = 1; $i <= $filedCount; $i++){
  if($filed_type_[$i] == 'checkbox'){

    $hidden = $_POST['wr'.$i.'_hidden'];
    for($j=0; $j<count($hidden); $j++){
      $checkbox = $_POST['wr'.$i];
      for($k=0; $k<count($checkbox); $k++){
        if($hidden[$j] == $checkbox[$k]){
          $checkbox_val[$i] .= $checkbox[$k];
        }
      }
      $checkbox_val[$i] .= '|';
    }
    ${wr_.$i} = $checkbox_val[$i];
  }else if($filed_type_[$i] == 'tel'){
    $tel1 = $_POST['wr_'.$i.'_tel1'];
    $tel2 = $_POST['wr_'.$i.'_tel2'];
    $tel3 = $_POST['wr_'.$i.'_tel3'];

    ${wr_.$i} = $tel1.'-'.$tel2.'-'.$tel3;
  }
}
?>
