<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
?>

<style>
    /* [1] 배경 설정: 화면 꽉 채우기 & 세련된 그라디언트 */
    #mb_login { 
        position: relative;
        display: flex; 
        justify-content: center; 
        align-items: center; 
        width: 100%;
        min-height: 100vh; /* 화면 전체 높이 사용 (잘림 방지) */
        background: linear-gradient(135deg, #f3f4f8 0%, #e8ecf1 100%); /* 은은한 고급 그레이톤 */
        font-family: "Pretendard Variable", "Pretendard", sans-serif;
        padding: 20px;
        box-sizing: border-box;
    }

    /* [2] 로그인 카드: 중앙 집중형 디자인 */
    .mbskin_box { 
        width: 100%; 
        max-width: 440px; 
        background: #ffffff; 
        border-radius: 24px; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08); /* 부드럽고 깊은 그림자 */
        padding: 60px 40px; 
        text-align: center;
        animation: fadeUp 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    /* 타이틀 */
    .mb_login_title { 
        font-size: 28px; 
        font-weight: 800; 
        color: #222; 
        margin: 0 0 10px 0; 
        letter-spacing: -0.5px;
    }
    .mb_login_subtitle {
        font-size: 14px;
        color: #888;
        margin-bottom: 40px;
        font-weight: 500;
    }
    
    /* 입력 폼 스타일 */
    .login_input_wrap { position: relative; margin-bottom: 15px; }
    .login_input { 
        width: 100%; 
        height: 56px; /* 시원하게 높임 */
        padding: 0 20px; 
        border: 2px solid #f0f0f0; 
        border-radius: 14px; 
        font-size: 16px; 
        color: #333;
        background: #f9fafb;
        box-sizing: border-box; 
        transition: all 0.3s ease;
        font-weight: 600;
    }
    .login_input::placeholder { color: #ccc; font-weight: 400; }
    
    /* 포커스 효과 */
    .login_input:focus { 
        border-color: #3235cd; 
        background: #fff; 
        box-shadow: 0 0 0 4px rgba(50, 53, 205, 0.1); 
        outline: none; 
    }

    /* 로그인 버튼 */
    .btn_submit { 
        width: 100%; 
        height: 58px; 
        background: #3235cd; /* 브랜드 컬러 */
        color: #fff; 
        border: none; 
        border-radius: 14px; 
        font-size: 17px; 
        font-weight: 800; 
        cursor: pointer; 
        margin-top: 15px; 
        transition: all 0.2s ease;
        box-shadow: 0 10px 20px rgba(50, 53, 205, 0.25); /* 버튼 그림자 */
    }
    .btn_submit:hover { 
        background: #2629a8; 
        transform: translateY(-2px); 
        box-shadow: 0 15px 25px rgba(50, 53, 205, 0.35); 
    }
    .btn_submit:active { transform: scale(0.98); }

    /* 하단 옵션 (자동로그인, 비번찾기) */
    .login_options { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-top: 25px; 
        font-size: 14px; 
        color: #666; 
    }
    
    /* 체크박스 커스텀 */
    .chk_box label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #666; font-weight: 500; transition: 0.2s; }
    .chk_box label:hover { color: #333; }
    .chk_box input { 
        appearance: none; width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 5px; cursor: pointer; transition: 0.2s; position: relative;
    }
    .chk_box input:checked { background: #3235cd; border-color: #3235cd; }
    .chk_box input:checked::after {
        content: '✔'; font-size: 12px; color: #fff; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    }

    .find_info { text-decoration: none; color: #999; font-weight: 500; transition: 0.2s; font-size: 13px; }
    .find_info:hover { color: #3235cd; text-decoration: underline; }

    /* 비회원 주문 (구분선 처리) */
    .guest_order_box { 
        margin-top: 40px; 
        padding-top: 30px; 
        border-top: 1px solid #eee; 
        text-align: center; 
    }
    .guest_title { font-size: 15px; font-weight: 700; margin-bottom: 8px; color: #333; }
    .guest_desc { font-size: 13px; color: #999; margin-bottom: 15px; }
    .btn_guest { 
        display: inline-block;
        width: 100%;
        padding: 14px 0;
        background: #f5f6f8; 
        color: #555; 
        border-radius: 12px; 
        font-size: 14px; 
        font-weight: 700; 
        cursor: pointer; 
        text-decoration: none; 
        transition: 0.2s; 
    }
    .btn_guest:hover { background: #e9ecef; color: #333; }

    /* 애니메이션 */
    @keyframes fadeUp { 
        from { opacity: 0; transform: translateY(30px); } 
        to { opacity: 1; transform: translateY(0); } 
    }

    /* 반응형 */
    @media (max-width: 480px) {
        .mbskin_box { padding: 40px 25px; border-radius: 0; box-shadow: none; background: transparent; }
        #mb_login { background: #fff; align-items: flex-start; padding-top: 60px; min-height: 100vh; }
        .mb_login_title { font-size: 24px; }
    }
</style>

<div id="mb_login">
    <div class="mbskin_box">
        
        <h3 class="mb_login_title">ADMIN</h1>
        <p class="mb_login_subtitle"><?php echo $g5['title'] ?> 관리자 및 회원 로그인</p>

        <form name="flogin" action="<?php echo $login_action_url ?>" onsubmit="return flogin_submit(this);" method="post">
            <input type="hidden" name="url" value="<?php echo $login_url ?>">

            <div class="login_input_wrap">
                <input type="text" name="mb_id" id="login_id" required class="login_input" placeholder="아이디를 입력하세요" autofocus>
            </div>
            
            <div class="login_input_wrap">
                <input type="password" name="mb_password" id="login_pw" required class="login_input" placeholder="비밀번호를 입력하세요">
            </div>

            <div class="login_options">
                <div class="chk_box">
                    <label for="login_auto_login">
                        <input type="checkbox" name="auto_login" id="login_auto_login">
                        자동로그인
                    </label>
                </div>
<!--                <a href="<?php echo G5_BBS_URL ?>/password_lost.php" class="find_info">비밀번호를 잊으셨나요?</a>-->
            </div>

            <button type="submit" class="btn_submit">로그인</button>
        </form>

        <?php @include_once(get_social_skin_path().'/social_login.skin.php'); ?>

        <?php if (isset($default['de_level_sell']) && $default['de_level_sell'] == 1) { ?>
            
            <?php if (preg_match("/orderform.php/", $url)) { ?>
            <div class="guest_order_box">
                <div class="guest_title">비회원 구매</div>
                <div style="margin-bottom:15px; font-size:13px; text-align:left; background:#f9f9f9; padding:10px; border-radius:8px;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="agree" value="1" style="accent-color:#333;">
                        <span style="color:#666;">개인정보 수집 이용에 동의합니다.</span>
                    </label>
                </div>
                <a href="javascript:guest_submit(document.flogin);" class="btn_guest">비회원 구매하기</a>
            </div>
            
            <script>
            function guest_submit(f) {
                if (document.getElementById('agree')) {
                    if (!document.getElementById('agree').checked) {
                        alert("개인정보수집에 대한 내용을 읽고 이에 동의하셔야 합니다.");
                        return;
                    }
                }
                f.url.value = "<?php echo $url; ?>";
                f.action = "<?php echo $url; ?>";
                f.submit();
            }
            </script>

            <?php } else if (preg_match("/orderinquiry.php$/", $url)) { ?>
            <div class="guest_order_box">
                <div class="guest_title">비회원 주문조회</div>
                <p class="guest_desc">회원가입 없이 주문내역을 확인하세요.</p>
                <form name="forderinquiry" method="post" action="<?php echo urldecode($url); ?>" autocomplete="off" style="margin-top:15px;">
                    <input type="text" name="od_id" value="<?php echo $od_id; ?>" required class="login_input" placeholder="주문번호" style="margin-bottom:8px;">
                    <input type="password" name="od_pwd" required class="login_input" placeholder="비밀번호" style="margin-bottom:8px;">
                    <button type="submit" class="btn_guest" style="background:#555; color:#fff;">조회하기</button>
                </form>
            </div>
            <?php } ?>

        <?php } ?>

    </div>
</div>

<script>
jQuery(function($){
    $("#login_auto_login").click(function(){
        if (this.checked) {
            this.checked = confirm("자동로그인을 사용하시면 다음부터 회원아이디와 비밀번호를 입력하실 필요가 없습니다.\n\n공공장소에서는 개인정보가 유출될 수 있으니 사용을 자제하여 주십시오.\n\n자동로그인을 사용하시겠습니까?");
        }
    });
});

function flogin_submit(f) {
    if( $( document.body ).triggerHandler( 'login_sumit', [f, 'flogin'] ) !== false ){
        return true;
    }
    return false;
}
</script>