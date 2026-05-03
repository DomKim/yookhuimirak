<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
?>

<style>
    /* 1. 전체 레이아웃 */
    .vst-write-wrap {
        font-family: "Pretendard Variable", "Pretendard", "Malgun Gothic", sans-serif;
        color: #333;
        max-width: 100%;
        margin: 0 auto;
        background-color: #fff;
        padding: 40px;
        border-radius: 16px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.03);
        margin-top: 150px;
    }

    /* 2. 헤더 (타이틀) */
    .vst-write-head { text-align: center; margin-bottom: 40px; }
    .vst-write-title { font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }
    .vst-write-desc { font-size: 15px; color: #666; margin: 0; }

    /* 3. 입력 폼 그룹 */
    .vst-form-group { margin-bottom: 25px; }
    .vst-label { 
        display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; 
    }
    .vst-label i { color: #3235cd; margin-right: 4px; font-size: 6px; vertical-align: middle; } /* 필수 아이콘 */
    .vst-guide-text { font-size: 12px; color: #888; margin-top: 5px; display: block; }

    /* 입력 필드 공통 */
    .vst-input, .vst-select, .vst-textarea {
        width: 100%; height: 48px; padding: 0 15px; border: 1px solid #ddd; border-radius: 8px;
        font-size: 15px; color: #333; background: #fff; box-sizing: border-box; transition: 0.2s;
        font-family: inherit;
    }
    .vst-input:focus, .vst-select:focus, .vst-textarea:focus {
        border-color: #3235cd; box-shadow: 0 0 0 3px rgba(50, 53, 205, 0.1); outline: none;
    }
    
    .vst-textarea { height: 300px; padding: 15px; resize: vertical; line-height: 1.6; }

    /* 파일 첨부 커스텀 */
    .vst-file-wrap { 
        background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 10px;
    }
    .vst-file-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
    .vst-file-input { flex: 1; }
    .vst-file-check { font-size: 13px; color: #666; display: flex; align-items: center; gap: 5px; }

    /* 옵션 체크박스 */
    .vst-option-box { 
        display: flex; gap: 20px; padding: 15px; background: #f8f9fa; 
        border-radius: 8px; border: 1px solid #eee; flex-wrap: wrap;
    }
    .vst-chk-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
    .vst-chk-label input { width: 18px; height: 18px; accent-color: #3235cd; }

    /* 4. 하단 버튼 */
    .vst-btn-area { margin-top: 50px; text-align: center; display: flex; justify-content: center; gap: 10px; }
    .vst-btn-submit { 
        min-width: 120px; height: 50px; background: #3235cd; color: #fff; border: none; 
        border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s;
    }
    .vst-btn-submit:hover { background: #2629a8; }
    
    .vst-btn-cancel { 
        min-width: 120px; height: 50px; background: #fff; color: #555; border: 1px solid #ddd; 
        border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; text-decoration: none;
        display: inline-flex; justify-content: center; align-items: center;
    }
    .vst-btn-cancel:hover { background: #f8f9fa; border-color: #ccc; color: #333; }

    /* 5. 반응형 */
    @media (max-width: 768px) {
        .vst-write-wrap { padding: 25px; margin-top: 120px; }
        .vst-write-title { font-size: 22px; }
        .vst-input, .vst-select { height: 45px; font-size: 14px; }
        .vst-btn-area { flex-direction: column; }
        .vst-btn-submit, .vst-btn-cancel { width: 100%; }
    }
</style>

<div class="vst-write-wrap">

    <div class="vst-write-head">
        <h2 class="vst-write-title"><?php echo $board['bo_subject'] ?> 글쓰기</h2>
    </div>

    <form name="fwrite" id="fwrite" action="<?php echo $action_url ?>" onsubmit="return fwrite_submit(this);" method="post" enctype="multipart/form-data" autocomplete="off" style="width:<?php echo $width; ?>">
    <input type="hidden" name="uid" value="<?php echo get_uniqid(); ?>">
    <input type="hidden" name="w" value="<?php echo $w ?>">
    <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
    <input type="hidden" name="wr_id" value="<?php echo $wr_id ?>">
    <input type="hidden" name="sca" value="<?php echo $sca ?>">
    <input type="hidden" name="sfl" value="<?php echo $sfl ?>">
    <input type="hidden" name="stx" value="<?php echo $stx ?>">
    <input type="hidden" name="spt" value="<?php echo $spt ?>">
    <input type="hidden" name="sst" value="<?php echo $sst ?>">
    <input type="hidden" name="sod" value="<?php echo $sod ?>">
    <input type="hidden" name="page" value="<?php echo $page ?>">
    
    <input type="hidden" name="wr_7" id="wr_7" value="<?php echo $write['wr_7']; ?>"> 
    <input type="hidden" name="wr_8" id="wr_8" value="<?php echo $write['wr_8']; ?>">                      
    <input type="hidden" name="wr_content" id="wr_content" value=" "> <?php
    $option = '';
    $option_hidden = '';
    if ($is_notice || $is_html || $is_secret || $is_mail) {
        $option = '';
        if ($is_notice) {
            $option .= "\n".'<label class="vst-chk-label"><input type="checkbox" id="notice" name="notice" value="1" '.$notice_checked.'> 공지</label>';
        }
        if ($is_html) {
            if ($is_dhtml_editor) {
                $option_hidden .= '<input type="hidden" value="html1" name="html">';
            } else {
                $option .= "\n".'<label class="vst-chk-label"><input type="checkbox" id="html" name="html" onclick="html_auto_br(this);" value="'.$html_value.'" '.$html_checked.'> HTML</label>';
            }
        }
        if ($is_secret) {
            if ($is_admin || $is_secret==1) {
                $option .= "\n".'<label class="vst-chk-label"><input type="checkbox" id="secret" name="secret" value="secret" '.$secret_checked.'> 비밀글</label>';
            } else {
                $option_hidden .= '<input type="hidden" name="secret" value="secret">';
            }
        }
        if ($is_mail) {
            $option .= "\n".'<label class="vst-chk-label"><input type="checkbox" id="mail" name="mail" value="mail" '.$recv_email_checked.'> 답변메일받기</label>';
        }
    }
    echo $option_hidden;
    ?>



    <div class="vst-form-group">
        <label for="wr_1" class="vst-label">출력순서</label>
        <input type="text" name="wr_1" value="<?php echo $wr_1 ?>" id="wr_1" class="vst-input" maxlength="3" placeholder="ex) 1 ~ 999" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');">
        <span class="vst-guide-text">※ 999 ~ 1 사이의 숫자. 숫자가 높을수록 먼저 출력됩니다.</span>
    </div>

    <div class="vst-form-group">
        <label class="vst-label"><i class="fa fa-circle"></i> 분류</label>
        <select name="ca_name" id="ca_name" class="vst-select">
            <option value="">분류를 선택하세요</option>
            <?php echo $category_option ?>
        </select>
    </div>

    <div class="vst-form-group">
        <label for="wr_subject" class="vst-label"><i class="fa fa-circle"></i> 지점명</label>
        <input type="text" name="wr_subject" value="<?php echo $subject ?>" id="wr_subject" required class="vst-input" placeholder="매장명을 입력해주세요.">
    </div>

    <div class="vst-form-group">
        <label for="wr_2" class="vst-label"><i class="fa fa-circle"></i> 월매출</label>
        <input type="text" name="wr_2" value="<?php echo $wr_2 ?>" id="wr_2" required class="vst-input" placeholder="월매출을 입력해주세요.">
    </div>

    <div class="vst-form-group">
        <label for="wr_4" class="vst-label"><i class="fa fa-circle"></i> 매출발생 월</label>
        <input type="text" name="wr_4" value="<?php echo $wr_4 ?>" id="wr_4" required class="vst-input" placeholder="매출발생 월">
    </div>


    <?php for ($i=0; $is_file && $i<0; $i++) { ?>
    <div class="vst-file-wrap">
        <label class="vst-label"><?php echo ($i==0) ? '매장사진' : '내용사진'; ?> #<?php echo $i+1 ?></label>
        <div class="vst-file-row">
            <input type="file" name="bf_file[]" class="vst-file-input frm_file" title="파일첨부 <?php echo $i+1 ?> : 용량 <?php echo $upload_max_filesize ?> 이하만 업로드 가능">
            
            <?php if ($is_file_content) { ?>
            <input type="text" name="bf_content[]" value="<?php echo ($w == 'u') ? $file[$i]['bf_content'] : ''; ?>" title="파일 설명을 입력해주세요." class="vst-input" style="height:36px; font-size:13px;" placeholder="파일 설명">
            <?php } ?>
            
            <?php if($w == 'u' && $file[$i]['file']) { ?>
            <div class="vst-file-check">
                <input type="checkbox" id="bf_file_del<?php echo $i ?>" name="bf_file_del[<?php echo $i; ?>]" value="1">
                <label for="bf_file_del<?php echo $i ?>"><?php echo $file[$i]['source'].'('.$file[$i]['size'].')'; ?> 삭제</label>
            </div>
            <?php } ?>
        </div>
    </div>
    <span class="vst-guide-text" style="color:red; margin-bottom:20px;">※ 파일은 1mb 이하로 업로드 해주세요.</span>
        
    <?php } ?>

    <?php if ($is_use_captcha) { ?>
    <div class="vst-form-group">
        <?php echo $captcha_html ?>
    </div>
    <?php } ?>

    <div class="vst-btn-area">
        <a href="./board.php?bo_table=<?php echo $bo_table ?>" class="vst-btn-cancel">취소</a>
        <input type="submit" value="작성완료" id="btn_submit" accesskey="s" class="vst-btn-submit">
    </div>

    </form>

</div>

<script>
// ★★★ 분류에서 '공지' 항목 삭제 ★★★
$(function() {
    $("#ca_name option[value='공지']").remove();
});

// 파일 용량 체크
$(".frm_file").on("change", function(){
    let maxSize = 1 * 1024 * 1024; // 1MB 사이즈 제한
    if(this.files[0].size > maxSize){
        alert("파일첨부 사이즈는 1MB 이내로 가능합니다.");
        $(this).val(''); 
        return; 
    }
});

<?php if($write_min || $write_max) { ?>
// 글자수 제한
var char_min = parseInt(<?php echo $write_min; ?>); // 최소
var char_max = parseInt(<?php echo $write_max; ?>); // 최대
check_byte("wr_content", "char_count");

$(function() {
    $("#wr_content").on("keyup", function() {
        check_byte("wr_content", "char_count");
    });
});
<?php } ?>

function html_auto_br(obj)
{
    if (obj.checked) {
        result = confirm("자동 줄바꿈을 하시겠습니까?\n\n자동 줄바꿈은 게시물 내용중 줄바뀐 곳을<br>태그로 변환하는 기능입니다.");
        if (result)
            obj.value = "html2";
        else
            obj.value = "html1";
    }
    else
        obj.value = "";
}
function fwrite_submit(f)
{
    <?php echo $editor_js; // 에디터 사용시 자바스크립트에서 내용을 폼필드로 넣어주며 내용이 입력되었는지 검사함 ?>

    var subject = "";
    var content = "";
    $.ajax({
        url: g5_bbs_url+"/ajax.filter.php",
        type: "POST",
        data: {
            "subject": f.wr_subject.value,
            "content": f.wr_content.value
        },
        dataType: "json",
        async: false,
        cache: false,
        success: function(data, textStatus) {
            subject = data.subject;
            content = data.content;
        }
    });

    if (subject) {
        alert("제목에 금지단어('"+subject+"')가 포함되어있습니다");
        f.wr_subject.focus();
        return false;
    }

    if (content) {
        alert("내용에 금지단어('"+content+"')가 포함되어있습니다");
        if (typeof(ed_wr_content) != "undefined")
            ed_wr_content.returnFalse();
        else
            f.wr_content.focus();
        return false;
    }

    if (document.getElementById("char_count")) {
        if (char_min > 0 || char_max > 0) {
            var cnt = parseInt(check_byte("wr_content", "char_count"));
            if (char_min > 0 && char_min > cnt) {
                alert("내용은 "+char_min+"글자 이상 쓰셔야 합니다.");
                return false;
            }
            else if (char_max > 0 && char_max < cnt) {
                alert("내용은 "+char_max+"글자 이하로 쓰셔야 합니다.");
                return false;
            }
        }
    }

    <?php echo $captcha_js; // 캡챠 사용시 자바스크립트에서 입력된 캡챠를 검사함 ?>

    document.getElementById("btn_submit").disabled = "disabled";

    return true;
}
</script>