<?php
if (!defined('_GNUBOARD_')) exit;

include_once(G5_LIB_PATH.'/visit.lib.php');
include_once('./admin.head.php');
include_once(G5_PLUGIN_PATH.'/jquery-ui/datepicker.php');

// 날짜 유효성 검사 및 기본값 설정
if (empty($fr_date) || ! preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $fr_date) ) $fr_date = G5_TIME_YMD;
if (empty($to_date) || ! preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $to_date) ) $to_date = G5_TIME_YMD;

$qstr = "fr_date=".$fr_date."&amp;to_date=".$to_date;
$query_string = $qstr ? '?'.$qstr : '';
?>

<style>
    .vst-layout-container * {
        box-sizing: border-box;
    }

    /* 검색 박스 */
    .vst-search-card {
        background: #fff;
        padding: 20px 25px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
        flex-wrap: wrap;
        border: 1px solid #f0f0f0;
    }

    .vst-title-label {
        font-size: 16px;
        font-weight: 700;
        color: #1a1a1a;
        margin-right: 15px;
        display: flex;
        align-items: center;
        min-width: 100px;
    }
    .vst-title-label::before {
        content: '';
        display: inline-block;
        width: 5px;
        height: 18px;
        background: #3235cd;
        border-radius: 3px;
        margin-right: 10px;
    }

    .vst-form-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .vst-input-date {
        border: 1px solid #e1e3e6;
        border-radius: 8px;
        padding: 0 15px;
        height: 42px;
        font-size: 14px;
        color: #333;
        width: 140px;
        text-align: center;
        background: #fff;
        transition: all 0.2s ease;
        cursor: text;
    }
    .vst-input-date:focus {
        border-color: #3235cd;
        outline: none;
        box-shadow: 0 0 0 3px rgba(50, 53, 205, 0.1);
    }

    .vst-tilde {
        color: #888;
        font-weight: 500;
        padding: 0 5px;
    }

    /* 탭 메뉴 */
    .vst-tab-container {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 0;
        -webkit-overflow-scrolling: touch;
        border-bottom: 2px solid #eaebef;
        margin-bottom: 30px;
    }
    .vst-tab-container::-webkit-scrollbar { display: none; }

    .vst-tab-anchor {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 24px;
        background: transparent;
        color: #666;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none !important;
        transition: all 0.2s;
        white-space: nowrap;
        border-radius: 12px 12px 0 0;
        position: relative;
        top: 2px;
    }
    .vst-tab-anchor:hover {
        color: #3235cd;
        background: rgba(50, 53, 205, 0.03);
    }
    .vst-tab-anchor.vst-active {
        background: #fff;
        color: #3235cd;
        font-weight: 800;
        border: 2px solid #eaebef;
        border-bottom-color: #fff;
    }
    .vst-tab-anchor.vst-active::after {
        content: '';
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        height: 3px;
        background: #3235cd;
        border-radius: 3px 3px 0 0;
    }

    /* 모바일 반응형 */
    @media (max-width: 768px) {
        .vst-search-card { padding: 15px; flex-direction: column; align-items: stretch; gap: 10px; }
        .vst-title-label { margin-bottom: 5px; }
        .vst-form-group { flex-wrap: wrap; }
        .vst-input-date { width: calc(50% - 15px); flex: 1; font-size: 13px; }
        .vst-btn-submit { width: 100%; margin-top: 5px; }

        .vst-tab-container { gap: 4px; border-bottom-width: 1px; }
        .vst-tab-anchor { padding: 10px 16px; font-size: 13px; }
    }
</style>

<div class="vst-layout-container">
    
    <form name="fvisit" id="fvisit" method="get">
        <div class="vst-search-card">
            <span class="vst-title-label">기간별 검색</span>
            
            <div class="vst-form-group">
                <input type="text" name="fr_date" value="<?php echo $fr_date ?>" id="fr_date" class="vst-input-date" maxlength="10" autocomplete="off" placeholder="시작일(YYYY-MM-DD)">
                <span class="vst-tilde">~</span>
                <input type="text" name="to_date" value="<?php echo $to_date ?>" id="to_date" class="vst-input-date" maxlength="10" autocomplete="off" placeholder="종료일(YYYY-MM-DD)">
            </div>
            
            <button type="submit" class="vst-btn-submit">조회하기</button>
        </div>
    </form>

    <?php
    $current_page = basename($_SERVER['PHP_SELF']);
    
    $visit_menus = array(
        'visit_list.php'    => '접속자',
        'visit_domain.php'  => '도메인',
        'visit_browser.php' => '브라우저',
        'visit_os.php'      => '운영체제',
        'visit_hour.php'    => '시간',
        'visit_week.php'    => '요일',
        'visit_date.php'    => '일',
        'visit_month.php'   => '월',
        'visit_year.php'    => '년'
    );
    
    if(version_compare(phpversion(), '5.3.0', '>=') && defined('G5_BROWSCAP_USE') && G5_BROWSCAP_USE) {
        $visit_menus['visit_device.php'] = '접속기기';
    }
    ?>
    
    <div class="vst-tab-container">
        <?php foreach($visit_menus as $link => $label) { 
            $active_class = ($current_page == $link) ? 'vst-active' : '';
        ?>
            <a href="./<?php echo $link . $query_string ?>" class="vst-tab-anchor <?php echo $active_class ?>">
                <?php echo $label ?>
            </a>
        <?php } ?>
    </div>

</div>

<script>
$(document).ready(function(){
    if ($.fn.datepicker) {
        $("#fr_date, #to_date").datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
            showButtonPanel: true,
            yearRange: "c-99:c+99",
            maxDate: "+0d"
        });
    } else {
        console.error("jQuery UI datepicker not loaded");
    }
});
</script>