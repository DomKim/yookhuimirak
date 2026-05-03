<?php
$sub_menu = "700400";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "실시간채팅(채널) 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');

?>

<form name="fconfigform" id="fconfigform" method="post" action="./chat_api_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<div class="local_desc01 local_desc">
  <p>
    채널 (<a href="https://channel.io/ko" target="_blank">https://channel.io/ko</a>) 또는 깃플(<a href="https://gitple.io/ko/" target="_blank">https://gitple.io/ko/</a>) 에서 회원가입후 생성되는 API 키를 아래 입력란에 입력후 설정버튼을 클릭 해 주시면, <br>
    홈페이지에 채팅서비스를 이용 할 수 있습니다.
  </p>
</div>

<section>
    <h2 class="h2_frm">실시간채팅 소스연동</h2>

    <div class="local_desc01 local_desc">
      <p>
        채널홈페이지 > 로그인 > 설정 > 플러그인 설정 > 플러그인 설치 > Web에 설치하기 > 기본 자바스크립트 > 소스복사후<br>
        아래 입력창에 입력후 설정 해주시면, 홈페이지에 채팅서비스를 사용할수 있습니다.
      </p>
    </div>

    <div class="tbl_frm01 tbl_wrap">
      <?php
      $chatFile = $fp = fopen(G5_THEME_PATH.'/act/chat_code.html', 'r');
      if ($chatFile) {
         $chat_code = '';
         while ($line = fgets($fp, 1024)) {
            $chat_code .= $line;
         }
      }
      ?>
      <textarea name="chat_script" id="chat_script" style="height:400px;"><?=$chat_code?></textarea>
      <?php
       fclose($chatFile); ?>


    </div>
</section>


<div class="btn_fixed_top btn_confirm">
  <input type="submit" value="사용안함" name="act_button" class="btn_submit btn" accesskey="s">
  <input type="submit" value="설정" name="act_button" class="btn_submit btn" accesskey="s">
</div>



</form>

<script>
// script
</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
