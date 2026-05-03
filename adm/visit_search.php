<?php
$sub_menu = '200810';
include_once('./_common.php');
include_once(G5_LIB_PATH.'/visit.lib.php');

auth_check_menu($auth, $sub_menu, 'r');

$g5['title'] = '접속자검색';
include_once('./admin.head.php');
include_once(G5_PLUGIN_PATH.'/jquery-ui/datepicker.php');

// [초기 설정]
$colspan = 6;
$sql_search = '';

// 검색 필터 유효성 검사
if(isset($sfl) && $sfl && !in_array($sfl, array('vi_ip','vi_date','vi_time','vi_referer','vi_agent','vi_browser','vi_os','vi_device')) ) {
    $sfl = '';
}
?>

<style>
    /* 검색 박스 */
    .vst-search-card {
        background: #f8f9fa;
        padding: 20px 25px;
        border-radius: 16px;
        border: 1px solid #eee;
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 30px;
        flex-wrap: wrap;
    }

    .vst-search-title {
        font-size: 16px;
        font-weight: 700;
        color: #1a1a1a;
        margin-right: 15px;
        display: flex;
        align-items: center;
    }
    .vst-search-title::before {
        content: ''; display: inline-block; width: 5px; height: 18px;
        background: #3235cd; border-radius: 3px; margin-right: 10px;
    }

    .vst-input-text {
        flex: 1;
        height: 42px;
        padding: 0 15px;
        border: 1px solid #e1e3e6;
        border-radius: 8px;
        font-size: 14px;
        color: #333;
        min-width: 200px;
    }
    .vst-input-text:focus {
        border-color: #3235cd;
        outline: none;
        box-shadow: 0 0 0 3px rgba(50, 53, 205, 0.1);
    }

    .vst-btn-reset {
        background: #fff;
        color: #666;
        border: 1px solid #ddd;
        padding: 0 16px;
        height: 42px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
    }
    .vst-btn-reset:hover {
        background: #f1f3f5;
        color: #333;
    }

    /* 컬럼 스타일 */
    .col-ip { width: 140px; font-weight: 700; color: #3235cd; flex-shrink: 0; }
    .col-ip a { text-decoration: none; color: #3235cd; }
    .col-ip a:hover { text-decoration: underline; }

    .col-referer {
        flex: 1;
        padding: 0 20px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .col-referer a { text-decoration: none; color: #555; transition: 0.2s; }
    .col-referer a:hover { color: #3235cd; text-decoration: underline; }

    .col-env { width: 100px; text-align: center; color: #888; font-size: 13px; flex-shrink: 0; }
    .col-device { width: 80px; text-align: center; font-weight: 600; color: #444; flex-shrink: 0; }
    .col-date { width: 150px; text-align: right; color: #999; font-size: 13px; flex-shrink: 0; }
    .col-date a { text-decoration: none; color: #555; font-weight: 600; }

    /* Datepicker 최상단 노출 */
    #ui-datepicker-div { z-index: 9999 !important; }

    /* 반응형 */
    @media (max-width: 900px) {
        .vst-search-card { flex-direction: column; align-items: stretch; gap: 10px; padding: 15px; }
        .vst-input-text { width: 100%; min-width: 100%; }
        .vst-btn-submit { width: 100%; }

        .col-ip { width: 100%; font-size: 15px; display: flex; justify-content: space-between; align-items: center; }
        .col-referer { width: 100%; padding: 0; white-space: normal; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 8px; font-size: 13px; }
        .col-meta-group { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
        .col-env, .col-device, .col-date { width: auto; text-align: left; padding: 0; }
        .col-date { margin-top: 5px; width: 100%; text-align: right; }
        .vst-input-text {
            flex: 1;
            height: 42px;
            padding: 11px 15px;
        }
    }
</style>

<div class="vst-layout-container">
    
    <form name="fvisit" method="get" onsubmit="return fvisit_submit(this);">
        <div class="vst-search-card">
            <span class="vst-search-title">접속자 검색</span>
            
            <select name="sfl" id="sch_sort" class="vst-select">
                <option value="vi_ip"<?php echo get_selected($sfl, 'vi_ip'); ?>>IP 주소</option>
                <option value="vi_referer"<?php echo get_selected($sfl, 'vi_referer'); ?>>접속 경로</option>
                <option value="vi_date"<?php echo get_selected($sfl, 'vi_date'); ?>>날짜 (YYYY-MM-DD)</option>
            </select>
            
            <input type="text" name="stx" value="<?php echo stripslashes($stx); ?>" id="sch_word" class="vst-input-text" placeholder="검색어를 입력하세요">
            
            <button type="submit" class="vst-btn-submit">검색</button>
            <a href="<?php echo $_SERVER['SCRIPT_NAME'] ?>" class="vst-btn-reset">초기화</a>
        </div>
    </form>

    <div class="vst-list-header">
        <div class="col-ip">IP</div>
        <div class="col-referer">접속 경로</div>
        <div class="col-env">브라우저</div>
        <div class="col-env">OS</div>
        <div class="col-device">기기</div>
        <div class="col-date">일시</div>
    </div>

    <?php
    $sql_common = " from {$g5['visit_table']} ";
    if ($sfl) {
        if($sfl=='vi_ip' || $sfl=='vi_date'){
            $sql_search = " where $sfl like '$stx%' ";
        }else{
            $sql_search = " where $sfl like '%$stx%' ";
        }
    }
    
    $sql = " select count(*) as cnt {$sql_common} {$sql_search} ";
    $row = sql_fetch($sql);
    $total_count = $row['cnt'];

    $rows = $config['cf_page_rows'];
    $total_page  = ceil($total_count / $rows);
    if ($page < 1) $page = 1;
    $from_record = ($page - 1) * $rows;

    $sql = " select * {$sql_common} {$sql_search}
             order by vi_id desc
             limit {$from_record}, {$rows} ";
    $result = sql_query($sql);

    $has_data = false;
    for ($i=0; $row=sql_fetch_array($result); $i++) {
        $has_data = true;
        
        $brow = $row['vi_browser'];
        if(!$brow) $brow = get_brow($row['vi_agent']);
        if(!$brow) $brow = '기타';

        $os = $row['vi_os'];
        if(!$os) $os = get_os($row['vi_agent']);
        if(!$os) $os = '기타';

        $device = $row['vi_device'];
        if(!$device) $device = '-';

        $link_html = '';
        if ($row['vi_referer']) {
            $referer = get_text(cut_str($row['vi_referer'], 255, ""));
            $referer = urldecode($referer);
            if (!is_utf8($referer)) {
                $referer = iconv('euc-kr', 'utf-8', $referer);
            }
            $full_url = get_text($row['vi_referer']);
            $display_url = $referer;
            $link_html = '<a href="'.$full_url.'" target="_blank" title="'.$full_url.'">'.$display_url.'</a>';
        } else {
            $link_html = '<span style="color:#ccc;">직접 접속</span>';
        }

        if ($is_admin == 'super') $ip = $row['vi_ip'];
        else $ip = preg_replace("/([0-9]+).([0-9]+).([0-9]+).([0-9]+)/", G5_IP_DISPLAY, $row['vi_ip']);
        
        // 검색 링크 (IP 클릭 시 해당 IP로 검색)
        $ip_link = $_SERVER['SCRIPT_NAME'].'?sfl=vi_ip&amp;stx='.$ip;
        // 날짜 링크 (날짜 클릭 시 해당 날짜로 검색)
        $date_link = $_SERVER['SCRIPT_NAME'].'?sfl=vi_date&amp;stx='.$row['vi_date'];
    ?>
    <div class="vst-list-row">
        <div class="col-ip">
            <a href="<?php echo $ip_link ?>"><?php echo $ip ?></a>
        </div>
        
        <div class="col-referer">
            <?php echo $link_html ?>
        </div>

        <div class="col-meta-group" style="display:contents;">
            <div class="col-env">
                <span class="vst-badge"><?php echo $brow ?></span>
            </div>
            <div class="col-env">
                <span class="vst-badge"><?php echo $os ?></span>
            </div>
            <div class="col-device">
                <span class="vst-badge" style="background:#e7f5ff; color:#1971c2;"><?php echo $device ?></span>
            </div>
        </div>

        <div class="col-date">
            <a href="<?php echo $date_link ?>"><?php echo $row['vi_date'] ?></a><br>
            <span style="font-size:11px; color:#aaa;"><?php echo $row['vi_time'] ?></span>
        </div>
    </div>
    <?php } ?>

    <?php if(!$has_data) { ?>
    <div style="text-align:center; padding:80px 0; color:#999;">
        <span style="display:block; font-size:40px; margin-bottom:10px;">🔍</span>
        검색된 자료가 없습니다.
    </div>
    <?php } ?>

</div>

<?php
$domain = isset($domain) ? $domain : '';
$pagelist = get_paging($config['cf_write_pages'], $page, $total_page, $_SERVER['SCRIPT_NAME'].'?'.$qstr.'&amp;domain='.$domain.'&amp;page=');
?>
<div class="vst-paging-wrap">
    <?php echo $pagelist; ?>
</div>

<script>
$(function(){
    // 검색 분류 변경 시 이벤트
    $("#sch_sort").change(function(){ 
        if($(this).val()=="vi_date"){ 
            // 날짜 선택 시 Datepicker 활성화
            $("#sch_word").datepicker({ changeMonth: true, changeYear: true, dateFormat: "yy-mm-dd", showButtonPanel: true, yearRange: "c-99:c+99", maxDate: "+0d" });
            $("#sch_word").attr("placeholder", "YYYY-MM-DD (날짜 선택)");
        }else{ 
            // 그 외에는 해제
            $("#sch_word").datepicker("destroy");
            $("#sch_word").attr("placeholder", "검색어를 입력하세요");
        }
    });

    // 초기 로딩 시 날짜 검색이면 Datepicker 활성화
    if($("#sch_sort option:selected").val()=="vi_date"){
        $("#sch_word").datepicker({ changeMonth: true, changeYear: true, dateFormat: "yy-mm-dd", showButtonPanel: true, yearRange: "c-99:c+99", maxDate: "+0d" });
    }
});

function fvisit_submit(f)
{
    return true;
}
</script>

<?php
include_once('./admin.tail.php');
?>