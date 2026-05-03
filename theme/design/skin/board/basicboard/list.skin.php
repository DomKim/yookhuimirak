<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// 선택옵션으로 인해 셀합치기가 가변적으로 변함
$colspan = 5;

if ($is_checkbox) $colspan++;
if ($is_good) $colspan++;
if ($is_nogood) $colspan++;

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
?>

<div class="vst-board-wrap">

    <div class="vst-header">
        <h2 class="vst-title"><?php echo $board['bo_subject'] ?></h2>
        <p class="vst-desc"><?=$config['cf_title']?> 커뮤니티의 <?php echo $board['bo_subject'] ?>입니다.</p>
    </div>

    <?php if ($is_category) { ?>
    <div class="vst-cate">
        <ul>
            <?php echo $category_option ?>
        </ul>
    </div>
    <?php } ?>

    <div class="vst-top-ctrl">
        <div class="vst-total">Total <b><?php echo number_format($total_count) ?></b>건</div>
        <?php if ($rss_href || $write_href) { ?>
        <div class="vst-btn-group">
            <?php if ($rss_href) { ?><a href="<?php echo $rss_href ?>" class="vst-btn">RSS</a><?php } ?>
            <?php if ($admin_href) { ?><a href="<?php echo $admin_href ?>" class="vst-btn">관리자</a><?php } ?>
        </div>
        <?php } ?>
    </div>

    <form name="fboardlist" id="fboardlist" action="./board_list_update.php" onsubmit="return fboardlist_submit(this);" method="post">
    <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
    <input type="hidden" name="sfl" value="<?php echo $sfl ?>">
    <input type="hidden" name="stx" value="<?php echo $stx ?>">
    <input type="hidden" name="spt" value="<?php echo $spt ?>">
    <input type="hidden" name="sca" value="<?php echo $sca ?>">
    <input type="hidden" name="sst" value="<?php echo $sst ?>">
    <input type="hidden" name="sod" value="<?php echo $sod ?>">
    <input type="hidden" name="page" value="<?php echo $page ?>">
    <input type="hidden" name="sw" value="">

    <div class="vst-list-head">
        <div class="vst-col-chk">
            <?php if ($is_checkbox) { ?>
            <input type="checkbox" id="chkall" onclick="if (this.checked) all_checked(true); else all_checked(false);">
            <?php } ?>
        </div>
        <div>번호</div>
        <div>제목</div>
        <div>작성자</div>
        <div>날짜</div>
        <div>조회</div>
        <div>추천</div>
    </div>

    <?php
    for ($i=0; $i<count($list); $i++) {
        $is_notice = $list[$i]['is_notice'] ? "vst-item-notice" : "";
    ?>
    <div class="vst-list-item <?php echo $is_notice ?>">
        
        <div class="vst-col-chk">
            <?php if ($is_checkbox) { ?>
            <input type="checkbox" name="chk_wr_id[]" value="<?php echo $list[$i]['wr_id'] ?>" id="chk_wr_id_<?php echo $i ?>">
            <?php } ?>
        </div>

        <div class="vst-col-num">
            <?php
            if ($list[$i]['is_notice']) // 공지사항
                echo '<span class="vst-badge badge-notice">공지</span>';
            else if ($wr_id == $list[$i]['wr_id'])
                echo "<span style='color:#3235cd; font-weight:700;'>열람중</span>";
            else
                echo $list[$i]['num'];
            ?>
        </div>

        <div class="vst-col-subject" style="padding-left:<?php echo $list[$i]['reply'] ? (strlen($list[$i]['wr_reply'])*10 + 15) : '15'; ?>px">
            <?php if ($is_category && $list[$i]['ca_name']) { ?>
                <span class="vst-badge" style="background:#eee; color:#555;"><?php echo $list[$i]['ca_name'] ?></span>
            <?php } ?>

            <a href="<?php echo $list[$i]['href'] ?>">
                <?php echo $list[$i]['icon_reply'] ?>
                
                <?php if (strstr($list[$i]['wr_option'], 'secret')) { ?>
                    <i class="fa fa-lock" style="color:#aaa; margin-right:5px;"></i>
                <?php } ?>
                
                <?php echo $list[$i]['subject'] ?>
                
                <?php if ($list[$i]['comment_cnt']) { ?><span class="cnt-cmt"><?php echo $list[$i]['wr_comment']; ?></span><?php } ?>
                
                <?php if (isset($list[$i]['icon_new']) && $list[$i]['icon_new']) echo '<span class="vst-badge badge-new" style="margin-left:5px;">N</span>'; ?>
                <?php if (isset($list[$i]['icon_hot']) && $list[$i]['icon_hot']) echo '<span class="vst-badge badge-hot" style="margin-left:5px;">H</span>'; ?>
            </a>
        </div>

        <div class="vst-info-row" style="display:contents;"> <div class="vst-col-writer"><?php echo $list[$i]['name'] ?></div>
            <div class="vst-col-date"><?php echo $list[$i]['datetime2'] ?></div>
            <div class="vst-col-hit"><i class="fa fa-eye" style="margin-right:3px;"></i><?php echo $list[$i]['wr_hit'] ?></div>
            <div class="vst-col-good"><i class="fa fa-thumbs-up" style="margin-right:3px;"></i><?php echo $list[$i]['wr_good'] ?></div>
        </div>

    </div>
    <?php } ?>

    <?php if (count($list) == 0) { ?>
    <div style="padding:80px 0; text-align:center; color:#999; border:1px solid #eee; border-radius:12px; background:#fff;">
        <i class="fa fa-exclamation-circle" style="font-size:40px; margin-bottom:15px; color:#ddd;"></i><br>
        게시물이 없습니다.
    </div>
    <?php } ?>

    <div class="vst-bottom">
        <div class="vst-btn-group">
            <?php if ($list_href) { ?><a href="<?php echo $list_href ?>" class="vst-btn">목록</a><?php } ?>
            <?php if ($is_checkbox) { ?>
                <button type="submit" name="btn_submit" value="선택삭제" onclick="document.pressed=this.value" class="vst-btn">삭제</button>
                <button type="submit" name="btn_submit" value="선택복사" onclick="document.pressed=this.value" class="vst-btn">복사</button>
                <button type="submit" name="btn_submit" value="선택이동" onclick="document.pressed=this.value" class="vst-btn">이동</button>
            <?php } ?>
        </div>
        
        <?php if ($write_href) { ?>
        <a href="<?php echo $write_href ?>" class="vst-btn vst-btn-write"><i class="fa fa-pencil"></i> 글쓰기</a>
        <?php } ?>
    </div>

    </form>

    <div class="vst-paging">
        <?php echo $write_pages;  ?>
    </div>

    <div style="display:flex; justify-content:center;">
        <form name="fsearch" method="get" class="vst-search">
            <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
            <input type="hidden" name="sca" value="<?php echo $sca ?>">
            <input type="hidden" name="sop" value="and">
            
            <select name="sfl" id="sfl" class="vst-select">
                <option value="wr_subject"<?php echo get_selected($sfl, 'wr_subject', true); ?>>제목</option>
                <option value="wr_content"<?php echo get_selected($sfl, 'wr_content'); ?>>내용</option>
                <option value="wr_subject||wr_content"<?php echo get_selected($sfl, 'wr_subject||wr_content'); ?>>제목+내용</option>
                <option value="mb_id,1"<?php echo get_selected($sfl, 'mb_id,1'); ?>>회원아이디</option>
                <option value="wr_name,1"<?php echo get_selected($sfl, 'wr_name,1'); ?>>글쓴이</option>
            </select>
            <input type="text" name="stx" value="<?php echo stripslashes($stx) ?>" required id="stx" class="vst-input" placeholder="검색어를 입력해주세요">
            <button type="submit" class="vst-btn-sch"><i class="fa fa-search"></i></button>
        </form>
    </div>

</div>

<?php if($is_checkbox) { ?>
<noscript>
<p>자바스크립트를 사용하지 않는 경우<br>별도의 확인 절차 없이 바로 선택삭제 처리하므로 주의하시기 바랍니다.</p>
</noscript>
<?php } ?>

<?php if ($is_checkbox) { ?>
<script>
function all_checked(sw) {
    var f = document.fboardlist;
    for (var i=0; i<f.length; i++) {
        if (f.elements[i].name == "chk_wr_id[]")
            f.elements[i].checked = sw;
    }
}

function fboardlist_submit(f) {
    var chk_count = 0;
    for (var i=0; i<f.length; i++) {
        if (f.elements[i].name == "chk_wr_id[]" && f.elements[i].checked)
            chk_count++;
    }
    if (!chk_count) {
        alert(document.pressed + "할 게시물을 하나 이상 선택하세요.");
        return false;
    }
    if(document.pressed == "선택복사") { select_copy("copy"); return; }
    if(document.pressed == "선택이동") { select_copy("move"); return; }
    if(document.pressed == "선택삭제") {
        if (!confirm("선택한 게시물을 정말 삭제하시겠습니까?\n\n한번 삭제한 자료는 복구할 수 없습니다.")) return false;
        f.removeAttribute("target");
        f.action = "./board_list_update.php";
    }
    return true;
}

function select_copy(sw) {
    var f = document.fboardlist;
    var sub_win = window.open("", "move", "left=50, top=50, width=500, height=550, scrollbars=1");
    f.sw.value = sw;
    f.target = "move";
    f.action = "./move.php";
    f.submit();
}
</script>
<?php } ?>