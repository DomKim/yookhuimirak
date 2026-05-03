<?php
include(G5_THEME_PATH.'/template/'.$name.'/form_data.php');

// 블럭파일 폴더 생성
$common_dir2 = G5_THEME_PATH."/template/".$name."/";
if(!is_dir($common_dir2)){
  mkdir($common_dir2);
}

// uikit 사용여부
if($form_filed[form_uikit] == 'y'){
  $addClass = 'uk-input';
  $addClass_select = 'uk-select';
}else{
  $addClass = '';
  $addClass_select = '';
}

// form 기본태그 생성.
$add_form_start = '<form name="fwrite" id="fwrite" action="'.G5_URL.'/bbs/write_update2.php" onsubmit="return fwrite_submit(this);" method="post" enctype="multipart/form-data" autocomplete="off" style="width:100%">';
$add_form_end = '</form>';

// form hidden input 생성.
$add_form_hidden = '<input type="hidden" name="w" value="">
  <input type="hidden" name="bo_table" value="'.$form_filed[board].'">
  <input type="hidden" name="wr_id" value="0">
  '.$add_form_secret.'
  <input type="hidden" name="token" value="<?php echo get_write_token("'.$form_filed[board].'"); ?>">
';



// 이름 및 비밀번호
if($form_filed['form_secret'] == 'y'){
  $add_form_secret = '<input type="hidden" name="secret" value="secret">';
  $add_form_secret_tag = '
  <!-- 이름 -->
  <div>
  <span class="title">이름</span>
  <input type="text" name="wr_name" required class="'.$addClass.'" placeholder="이름">
  </div>

  <!-- 비밀번호 -->
  <div>
  <span class="title">비밀번호</span>
  <input type="password" name="wr_password" class="'.$addClass.'" placeholder="비밀번호">
  </div>
  ';
}else{
  $add_form_secret = '';
  $add_form_secret_tag = '
  <!-- 이름 -->
  <div>
  <span class="title">이름</span>
  <input type="text" name="wr_name" required class="'.$addClass.'" placeholder="이름">
  <!-- 비밀번호 -->
  <input type="hidden" name="wr_password" value="!1234!">
  </div>
  ';
}


$add_wr_html .= $add_form_secret_tag;



// wr_ input 태그 생성.
for($i = 1; $i <= $filedCount; $i++){
  $filed_arr_[$i] = explode('|',$form_filed['wr_'.$i]);
  $filed_name_[$i] = $filed_arr_[$i][0];
  $filed_type_[$i] = $filed_arr_[$i][1];
  $filed_pl_[$i] = $filed_arr_[$i][2];
  $filed_default_[$i] = $filed_arr_[$i][3];
  $filed_required_[$i] = $filed_arr_[$i][4];
  $filed_admin_[$i] = $filed_arr_[$i][5];

  if($filed_type_[$i] == 'selectbox' || $filed_type_[$i] == 'checkbox' || $filed_type_[$i] == 'radio'){
    $type = 'select';
    $wr_val_arr = explode('|',$form_filed['wr_'.$i.'_val']);
    $wr_val_count = count($wr_val_arr);
  }else if($filed_type_[$i] == 'tel'){
    $type = 'tel';
  }else{
    $type = 'text';
  }

  if($filed_admin_[$i] != 'y'){
    if($filed_name_[$i]){
      $add_wr_html .= '
      <!-- '.$filed_name_[$i].' -->
      <div>
      <span class="title">'.$filed_name_[$i].'</span>
      ';

      if($type == 'select'){
        if($filed_type_[$i] == 'selectbox'){
          if($filed_required_[$i]=='y'){ $required = 'required'; }
          $add_wr_html .='<select name="wr_'.$i.'" class="'.$addClass_select.'" '.$required.'>
          ';
          $add_wr_html .='<option>선택하세요</option>
          ';
        }

        for($j = 0; $j < $wr_val_count; $j++){
          $wr_val_name = $wr_val_arr[$j];

          if($filed_type_[$i] == 'checkbox'){

            $add_wr_html .='<input type="checkbox" name="wr'.$i.'[]" value="'.$wr_val_name.'" > '.$wr_val_name.'
            <input type="hidden" name="wr'.$i.'_hidden[]" value="'.$wr_val_name.'">
            ';

          }else if($filed_type_[$i] == 'radio'){

            if($filed_required_[$i]=='y'){ $required_view = 'required'; }
            $add_wr_html .='
        <input type="radio" name="wr_'.$i.'" value="'.$wr_val_name.'"> '.$wr_val_name.'';

          }else if($filed_type_[$i] == 'selectbox'){

            $add_wr_html .='<option value="'.$wr_val_name.'">'.$wr_val_name.'</option>
            ';

          }
        }

        if($filed_type_[$i] == 'selectbox'){
          $add_wr_html .='</select>';
        }

      }else if($type == 'tel'){
        $add_wr_html .='
        <input type="text" name="wr_'.$i.'_tel1" class="" placeholder="010">
        <input type="text" name="wr_'.$i.'_tel2" class="">
        <input type="text" name="wr_'.$i.'_tel3" class="">
        ';
      }else{
        if($filed_required_[$i]=='y'){ $required_view = 'required'; }
        if($filed_pl_[$i]){ $placeholder = 'placeholder="'.$filed_pl_[$i].'"'; }else{ $placeholder=''; }
        $add_wr_html .= '  <input type="text" name="wr_'.$i.'" class="'.$addClass.'" '.$required_view.' '.$placeholder.'>';
      }

      $add_wr_html .= '
      </div>
      ';
    }
  }
}

// 제목 & 내용 input태그
if($wr_subject_hidden == 'y'){
  $add_wr_html .='
  <input type="hidden" name="wr_subject" value="'.$wr_subject_default.'" id="wr_subject">
  ';
}else{
  if($wr_subject_pl){ $placeholder = 'placeholder="'.$wr_subject_pl.'"'; }else{ $placeholder=''; }
  $add_wr_html .= '
  <!-- '.$wr_subject_name.' -->
  <div>
  <span class="title">'.$wr_subject_name.'</span>
  <input type="text" name="wr_subject" class="'.$addClass.'" value="'.$wr_subject_default.'" '.$required_view.' '.$placeholder.'>
  </div>
  ';
}

if($wr_content_hidden == 'y'){
  $add_wr_html .='
  <input type="hidden" name="wr_content" value="'.$wr_content_default.'" id="wr_content">
  ';
}else{
  if($wr_content_pl){ $placeholder = 'placeholder="'.$wr_content_pl.'"'; }else{ $placeholder=''; }
  $add_wr_html .= '
  <!-- '.$wr_content_name.' -->
  <div>
  <span class="title">'.$wr_content_name.'</span>
  <textarea name="wr_content" class="'.$addClass.'" '.$required_view.' '.$placeholder.'>
  '.$wr_content_default.'
  </textarea>
  </div>
  ';
}


// 링크 태그
if($form_filed[form_link] == 'y'){
  if($form_filed[form_link_1_title]){
    $link1 = '<span class="title">'.$form_filed[form_link_1_title].'</span>
    <input type="text" name="wr_link1" class="'.$addClass.'">
    ';
  }
  if($form_filed[form_link_2_title]){
    $link2 = '<span class="title">'.$form_filed[form_link_2_title].'</span>
    <input type="text" name="wr_link2" class="'.$addClass.'">
    ';
  }
  $linkTag = '
  <div>
    '.$link1.'
    '.$link2.'
  </div>
  ';
}else{
  $linkTag = '';
}

// 파일업로드 태그
if($form_filed[form_file] == 'y'){
  if($form_filed[form_filename]){
    $file1 = '<span class="title">'.$form_filed[form_filename].'</span>
    <input type="file" name="bf_file[]" id="bf_file_1" class="'.$addClass.'">
    ';
  }
  if($form_filed[form_filename2]){
    $file2 = '<span class="title">'.$form_filed[form_filename2].'</span>
    <input type="file" name="bf_file[]" id="bf_file_2" class="'.$addClass.'">
    ';
  }
  $fileTag = '
  <div>
    '.$file1.'
    '.$file2.'
  </div>
  ';
}else{
  $fileTag = '';
}


// 자동글방지
if($config['cf_captcha'] == 'kcaptcha'){
  $captcha_path = '"/kcaptcha/kcaptcha.lib.php"';
}else if($config['cf_captcha'] == 'recaptcha'){
  $captcha_path = '"/recaptcha/recaptcha.user.lib.php"';
}else if($config['cf_captcha'] == 'recaptcha_inv'){
  $captcha_path = '"/recaptcha_inv/recaptcha.user.lib.php"';
}

if($form_filed[form_chaptcha] == 'y'){
  $chaptcha_lib = 'include_once(G5_PLUGIN_PATH.'.$captcha_path.');';
  $add_chaptcha = '
  <div>
  <?php echo captcha_html(); ?>
  </div>
  ';
}else{
  $chaptcha_lib = '';
  $add_chaptcha = '';
}


// html 파일에 들어갈 내용 조합.
$add_html  = $add_form_start.'
'.$add_form_hidden.'
'.$add_wr_html.'
'.$linkTag.'
'.$fileTag.'
'.$add_chaptcha.'
  <div>
    <input type="checkbox" name="" id="">개인정보 수집에동의합니다.
  </div>
  <div>
    <input type="submit" value="작성완료" id="btn_submit" accesskey="s" class="btn_submit btn">
  </div>
'.$add_form_end;

// html 파일 생성
$file1 = fopen($common_dir2."index.html","w");
fwrite($file1, '<?php
add_stylesheet("<link rel=\'stylesheet\' href=\'".G5_THEME_URL."/template/'.$name.'/style.css\'>", 0);
'.$chaptcha_lib.'
?>
<!-- 내용시작 -->
<div class="'.$name.'">
  <div class="container">
  <!-- 전송폼 -->
  '.$add_html.'
  </div>
</div>
<!-- 내용끝 -->

<script src="<?=G5_THEME_URL?>/template/'.$name.'/script.js" ></script>
');
fclose($file1);

?>
