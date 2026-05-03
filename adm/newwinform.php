<?php
$sub_menu = '600110';
require_once './_common.php';
require_once G5_EDITOR_LIB;

auth_check_menu($auth, $sub_menu, "w");

$nw_id = isset($_REQUEST['nw_id']) ? (string)preg_replace('/[^0-9]/', '', $_REQUEST['nw_id']) : 0;
$nw = array(
    'nw_begin_time' => '',
    'nw_end_time' => '',
    'nw_subject' => '',
    'nw_content' => '',
    'nw_division' => '',
    'nw_device' => '',
    'nw_disable_hours' => 0,
    'nw_left' => 0,
    'nw_top' => 0,
    'nw_width' => 0,
    'nw_height' => 0,
    'nw_order' => 0
);

$html_title = "팝업레이어";

// 팝업레이어 테이블에 쇼핑몰, 커뮤니티 인지 구분하는 여부 필드 추가 (DB 구조 변경 체크)
if(!sql_query(" select nw_division from {$g5['new_win_table']} limit 1 ", false)) {
    $sql = " ALTER TABLE `{$g5['new_win_table']}` ADD `nw_division` VARCHAR(10) NOT NULL DEFAULT 'both' ";
    sql_query($sql, false);
}

if ($w == "u") {
    $html_title .= " 수정";
    $sql = " select * from {$g5['new_win_table']} where nw_id = '$nw_id' ";
    $nw = sql_fetch($sql);
    if (!(isset($nw['nw_id']) && $nw['nw_id'])) {
        alert("등록된 자료가 없습니다.");
    }
} else {
    $html_title .= " 입력";
    $nw['nw_device'] = 'both';
    $nw['nw_disable_hours'] = 24;
    $nw['nw_left']    = 10;
    $nw['nw_top']     = 10;
    $nw['nw_width']   = 450;
    $nw['nw_height'] = 500;
    $nw['nw_content_html'] = 2;
    $nw['nw_order'] = 0;
}

$g5['title'] = $html_title;
require_once G5_ADMIN_PATH . '/admin.head.php';
?>

<style>
    /* 섹션 타이틀 */
    .vst-section-title {
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #3235cd;
        display: flex;
        align-items: center;
    }
    .vst-section-title span { margin-left: auto; font-size: 13px; color: #888; font-weight: 400; }

    /* 폼 그리드 */
    .vst-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 40px;
    }
    .vst-form-full { grid-column: span 2; }

    .vst-form-group { margin-bottom: 20px; }
    .vst-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #555;
        margin-bottom: 8px;
    }
    .vst-label strong { color: #e03131; margin-left: 3px; }

    /* 체크박스 그룹 */
    .vst-check-group {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
        font-size: 13px;
        color: #666;
    }

    /* 도움말 텍스트 */
    .vst-help {
        font-size: 12px;
        color: #888;
        margin-top: 6px;
        line-height: 1.5;
    }

    /* 버튼 영역 */
    .vst-btn-area {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 40px;
        padding-top: 30px;
        border-top: 1px solid #eee;
    }

    .vst-btn-list {
        background: #fff;
        color: #555;
        border: 1px solid #ddd;
        padding: 12px 30px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        transition: 0.2s;
    }
    .vst-btn-list:hover { background: #f8f9fa; border-color: #ccc; }

    /* 반응형 */
    @media (max-width: 768px) {
        .vst-form-grid { grid-template-columns: 1fr; gap: 0; }
        .vst-form-full { grid-column: span 1; }
        .vst-btn-submit { width: 100%; }
        .vst-btn-list { width: 100%; justify-content: center; }
        .vst-btn-area { flex-direction: column-reverse; }
    }
</style>

<div class="vst-layout-container">
    
    <div class="local_desc01 local_desc" style="margin-bottom:30px; background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee;">
        <p style="margin:0; color:#555;">💡 초기화면 접속 시 자동으로 뜰 팝업레이어를 설정합니다.</p>
    </div>

    <form name="frmnewwin" action="./newwinformupdate.php" onsubmit="return frmnewwin_check(this);" method="post" autocomplete="off">
        <input type="hidden" name="w" value="<?php echo $w; ?>">
        <input type="hidden" name="nw_id" value="<?php echo $nw_id; ?>">
        <input type="hidden" name="token" value="">

        <div class="vst-section-title">1. 기본 설정</div>
        <div class="vst-form-grid">
            
            <div class="vst-form-group">
                <label class="vst-label" for="nw_division">구분</label>
                <select name="nw_division" id="nw_division" class="vst-select">
                    <option value="comm" <?php echo get_selected($nw['nw_division'], 'comm'); ?>>커뮤니티</option>
                    <?php if (defined('G5_USE_SHOP') && G5_USE_SHOP) { ?>
                        <option value="both" <?php echo get_selected($nw['nw_division'], 'both', true); ?>>커뮤니티와 쇼핑몰</option>
                        <option value="shop" <?php echo get_selected($nw['nw_division'], 'shop'); ?>>쇼핑몰</option>
                    <?php } ?>
                </select>
                <div class="vst-help">어디에 팝업을 띄울지 선택합니다.</div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_device">접속기기</label>
                <select name="nw_device" id="nw_device" class="vst-select">
                    <option value="both" <?php echo get_selected($nw['nw_device'], 'both', true); ?>>PC와 모바일 모두</option>
                    <option value="pc" <?php echo get_selected($nw['nw_device'], 'pc'); ?>>PC만</option>
                    <option value="mobile" <?php echo get_selected($nw['nw_device'], 'mobile'); ?>>모바일만</option>
                </select>
                <div class="vst-help">팝업이 표시될 기기를 설정합니다.</div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_disable_hours">다시 보지 않음 시간<strong>*</strong></label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="number" name="nw_disable_hours" value="<?php echo $nw['nw_disable_hours']; ?>" id="nw_disable_hours" required class="vst-input" style="width:100px;">
                    <span style="color:#333;">시간</span>
                </div>
                <div class="vst-help">고객이 '다시 보지 않음' 체크 시 설정한 시간 동안 팝업이 뜨지 않습니다.</div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_order">노출 순서</label>
                <input type="number" name="nw_order" value="<?php echo $nw['nw_order']; ?>" id="nw_order" class="vst-input" min="0" max="999">
                <div class="vst-help">숫자가 클수록 앞에(먼저) 출력됩니다. (0~999)</div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_begin_time">시작 일시<strong>*</strong></label>
                <input type="text" name="nw_begin_time" value="<?php echo $nw['nw_begin_time']; ?>" id="nw_begin_time" required class="vst-input" maxlength="19">
                <div class="vst-check-group">
                    <input type="checkbox" name="nw_begin_chk" value="<?php echo date("Y-m-d 00:00:00", G5_SERVER_TIME); ?>" id="nw_begin_chk" onclick="if (this.checked == true) this.form.nw_begin_time.value=this.form.nw_begin_chk.value; else this.form.nw_begin_time.value = this.form.nw_begin_time.defaultValue;">
                    <label for="nw_begin_chk">오늘부터 시작</label>
                </div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_end_time">종료 일시<strong>*</strong></label>
                <input type="text" name="nw_end_time" value="<?php echo $nw['nw_end_time']; ?>" id="nw_end_time" required class="vst-input" maxlength="19">
                <div class="vst-check-group">
                    <input type="checkbox" name="nw_end_chk" value="<?php echo date("Y-m-d 23:59:59", G5_SERVER_TIME + (60 * 60 * 24 * 7)); ?>" id="nw_end_chk" onclick="if (this.checked == true) this.form.nw_end_time.value=this.form.nw_end_chk.value; else this.form.nw_end_time.value = this.form.nw_end_time.defaultValue;">
                    <label for="nw_end_chk">오늘부터 7일 후 종료</label>
                </div>
            </div>

        </div>

        <div class="vst-section-title">2. 위치 및 크기 설정</div>
        <div class="vst-form-grid">
            
            <div class="vst-form-group">
                <label class="vst-label" for="nw_left">좌측 위치 (Left)<strong>*</strong></label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="text" name="nw_left" value="<?php echo $nw['nw_left']; ?>" id="nw_left" required class="vst-input">
                    <span>px</span>
                </div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_top">상단 위치 (Top)<strong>*</strong></label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="text" name="nw_top" value="<?php echo $nw['nw_top']; ?>" id="nw_top" required class="vst-input">
                    <span>px</span>
                </div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_width">팝업 넓이 (Width)<strong>*</strong></label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="text" name="nw_width" value="<?php echo $nw['nw_width']; ?>" id="nw_width" required class="vst-input">
                    <span>px</span>
                </div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_height">팝업 높이 (Height)<strong>*</strong></label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="text" name="nw_height" value="<?php echo $nw['nw_height']; ?>" id="nw_height" required class="vst-input">
                    <span>px</span>
                </div>
            </div>

        </div>

        <div class="vst-section-title">3. 내용 작성</div>
        <div class="vst-form-grid" style="grid-template-columns: 1fr;">
            
            <div class="vst-form-group">
                <label class="vst-label" for="nw_subject">팝업 제목<strong>*</strong></label>
                <input type="text" name="nw_subject" value="<?php echo get_sanitize_input($nw['nw_subject']); ?>" id="nw_subject" required class="vst-input">
                <div class="vst-help">관리자 목록에 표시되는 제목입니다.</div>
            </div>

            <div class="vst-form-group">
                <label class="vst-label" for="nw_content">내용</label>
                <?php echo editor_html('nw_content', get_text(html_purifier($nw['nw_content']), 0)); ?>
            </div>

        </div>

        <div class="vst-btn-area">
            <a href="./newwinlist.php" class="vst-btn-list">목록으로</a>
            <button type="submit" class="vst-btn-submit" accesskey="s">저장하기</button>
        </div>

    </form>
</div>

<script>
    function frmnewwin_check(f) {
        errmsg = "";
        errfld = "";

        <?php echo get_editor_js('nw_content'); ?>

        if (f.nw_subject.value == "") {
            alert("제목을 입력하세요.");
            f.nw_subject.focus();
            return false;
        }

        return true;
    }
</script>

<?php
require_once G5_ADMIN_PATH . '/admin.tail.php';
?>