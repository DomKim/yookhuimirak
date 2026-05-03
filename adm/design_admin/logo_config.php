<?php
$sub_menu = "600100";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "로고설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');
?>

<form name="fconfigform" id="fconfigform" method="post" action="./logo_config_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<section id="anc_cf_logo">
    <h2 class="h2_frm">홈페이지 로고설정</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>홈페이지 기본환경 설정</caption>
        <colgroup>
            <col class="grid_4">
            <col>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>

        <tr>
            <th scope="row">상단로고이미지</th>
            <td>
                <div id="logoimg" class="banner_or_img" style="margin-bottom:20px;">
                    <img src="<?php echo G5_DATA_URL; ?>/common/logo_img" alt="">
                </div>

                <?php echo help("상단로고를 직접 올릴 수 있습니다. 이미지 파일만 가능합니다."); ?>
                <input type="file" name="logo_img" id="logo_img" style="float:left;">
                <?php
                $logo_img = G5_DATA_PATH."/common/logo_img";
                if (file_exists($logo_img))
                {
                    $size = getimagesize($logo_img);
                ?>
                <input type="checkbox" name="logo_img_del" value="1" id="logo_img_del">
                <label for="logo_img_del"><span class="sound_only">상단로고이미지</span> 삭제</label>
                <span class="scf_img_logoimg"></span>


                <?php } ?>

                <div style="padding-top:10px;">이미지주소 : <?php echo G5_DATA_URL.'/common/logo_img';?></div>
            </td>
        </tr>
        <tr>
            <th scope="row">하단로고이미지</th>
            <td>
                <div id="logoimg2" class="banner_or_img" style="margin-bottom:20px; background:#d3d3d3; padding:10px;">
                    <img src="<?php echo G5_DATA_URL; ?>/common/logo_img2" alt="">
                </div>

                <?php echo help("하단로고를 직접 올릴 수 있습니다. 이미지 파일만 가능합니다."); ?>
                <input type="file" name="logo_img2" id="logo_img2" style="float:left;">
                <?php
                $logo_img2 = G5_DATA_PATH."/common/logo_img2";
                if (file_exists($logo_img2))
                {
                    $size = getimagesize($logo_img2);
                ?>
                <input type="checkbox" name="logo_img_del2" value="1" id="logo_img_del2">
                <label for="logo_img_del2"><span class="sound_only">하단로고이미지</span> 삭제</label>
                <span class="scf_img_logoimg2"></span>


                <?php } ?>

                <div style="padding-top:10px;">이미지주소 : <?php echo G5_DATA_URL.'/common/logo_img2';?></div>
            </td>
        </tr>


        <tr>
            <th scope="row">관리자 심볼이미지</th>
            <td>
                <div id="logoimg3" class="banner_or_img" style="margin-bottom:20px; background:#d3d3d3; padding:10px;">
                    <img src="<?php echo G5_DATA_URL; ?>/common/logo_img3" alt="">
                </div>

                <?php echo help("관리자페이지 커버이미지를 업로드 합니다. 이미지 파일만 가능합니다. 사이즈 90 x 90 pixel"); ?>
                <input type="file" name="logo_img3" id="logo_img3" style="float:left;">
                <?php
                $logo_img3 = G5_DATA_PATH."/common/logo_img3";
                if (file_exists($logo_img3))
                {
                    $size = getimagesize($logo_img3);
                ?>
                <input type="checkbox" name="logo_img_del3" value="1" id="logo_img_del3">
                <label for="logo_img_del3"><span class="sound_only">하단로고이미지</span> 삭제</label>
                <span class="scf_img_logoimg3"></span>


                <?php } ?>

                <div style="padding-top:10px;">이미지주소 : <?php echo G5_DATA_URL.'/common/logo_img3';?></div>
            </td>
        </tr>


        </tbody>
      </table>
    </div>
</section>


<div class="btn_fixed_top btn_confirm">
    <input type="submit" value="확인" class="btn_submit btn" accesskey="s">
</div>

</form>



<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
