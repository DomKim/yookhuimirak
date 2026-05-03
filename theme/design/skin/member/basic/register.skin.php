<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

$page = 'register';
// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$member_skin_url.'/style.css">', 0);
?>

<!-- 회원가입약관 동의 시작 { -->
<div id="fregister">

  <form  name="fregister" id="fregister" action="<?php echo $register_action_url ?>" onsubmit="return fregister_submit(this);" method="POST" autocomplete="off">
    <div class="join_page">
  		<h1>JOIN</h1>
  		<h4 style="text-align:center;margin:10px auto;padding:0;color:#666;letter-spacing:-2px;font-size:16px;">
        방문해 주셔서 감사합니다.<br>회원가입을 하시면 더 다양한 서비스를 만나실 수 있습니다.
      </h4>
      <div class="under-line"></div>
  		<div class="terms">
        <div id="fregister_chkall">
            <label for="chk_all">전체선택</label>
            <input type="checkbox" name="chk_all"  value="1"  id="chk_all">
        </div>
  			<h4>회원가입약관</h4>
  			<textarea class="terms_box" readonly><?php echo get_text($config['cf_stipulation']) ?></textarea><br><br>
  			<p><input type="checkbox" name="agree" value="1" id="agree11"> 회원가입약관의 내용에 동의합니다.</p>
  		</div>
  		<div class="pri">
  			<h4>개인정보처리방침안내</h4>
  			<div class="pri_box">
  				<table class="pri_table">
  					<tr class="pri_tit">
  						<td>목적</td>
  						<td>항목</td>
  						<td>보유기간</td>
  					</tr>
  					<tr>
  						<td>이용자 식별 및 본인여부 확인 </td>
  						<td>아이디,이름,비밀번호</td>
  						<td>회원 탈퇴시까지</td>
  					</tr>
  					<tr>
  						<td>고객서비스 이용에 관한 통지<br>CS대응을 위한 이용자 식별</td>
  						<td>연락처(이메일,휴대전화번호)</td>
  						<td>회원 탈퇴시까지</td>
  					</tr>
  				</table>
  			</div><br>
  			<p><input type="checkbox" name="agree2" value="1" id="agree21"> 개인정보처리방침안내의 내용에 동의합니다.</p>
  		</div>
      <center>
        <button class="join_btn" type="submit">JOIN</button>
      </center>
  	</div>
  </form>

  <?php
  // 소셜로그인 사용시 소셜로그인 버튼
  @include_once(get_social_skin_path().'/social_register.skin.php');
  ?>

</div>

    <script>
    function fregister_submit(f)
    {
        if (!f.agree.checked) {
            alert("회원가입약관의 내용에 동의하셔야 회원가입 하실 수 있습니다.");
            f.agree.focus();
            return false;
        }

        if (!f.agree2.checked) {
            alert("개인정보처리방침안내의 내용에 동의하셔야 회원가입 하실 수 있습니다.");
            f.agree2.focus();
            return false;
        }

        return true;
    }

    jQuery(function($){
        // 모두선택
        $("input[name=chk_all]").click(function() {
            if ($(this).prop('checked')) {
                $("input[name^=agree]").prop('checked', true);
            } else {
                $("input[name^=agree]").prop("checked", false);
            }
        });
    });

    </script>
</div>
<!-- } 회원가입 약관 동의 끝 -->
