<?php
$sub_menu = "300100";
require_once './_common.php';

auth_check_menu($auth, $sub_menu, 'r');

$sql_common = " from {$g5['board_table']} a ";
$sql_search = " where (1) ";

if ($is_admin != "super") {
    $sql_common .= " , {$g5['group_table']} b ";
    $sql_search .= " and (a.gr_id = b.gr_id and b.gr_admin = '{$member['mb_id']}') ";
}

if ($stx) {
    $sql_search .= " and ( ";
    switch ($sfl) {
        case "bo_table":
            $sql_search .= " ($sfl like '$stx%') ";
            break;
        case "a.gr_id":
            $sql_search .= " ($sfl = '$stx') ";
            break;
        default:
            $sql_search .= " ($sfl like '%$stx%') ";
            break;
    }
    $sql_search .= " ) ";
}

if (!$sst) {
    $sst  = "a.gr_id, a.bo_table";
    $sod = "asc";
}
$sql_order = " order by $sst $sod ";

$sql = " select count(*) as cnt {$sql_common} {$sql_search} {$sql_order} ";
$row = sql_fetch($sql);
$total_count = $row['cnt'];

$rows = $config['cf_page_rows'];
$total_page  = ceil($total_count / $rows);
if ($page < 1) {
    $page = 1;
}
$from_record = ($page - 1) * $rows;

$sql = " select * {$sql_common} {$sql_search} {$sql_order} limit {$from_record}, {$rows} ";
$result = sql_query($sql);

$g5['title'] = '게시판관리';
require_once './admin.head.php';
?>

<link rel="stylesheet" href="<?php echo G5_ADMIN_URL ?>/css/brd_admin.css?ver=<?php echo G5_TIME_YMDHIS; ?>">

<div id="brd-container">
    
    <div class="brd-top-area">
        <div class="brd-total-count">
            생성된 게시판 <b><?php echo number_format($total_count) ?></b>개
        </div>

        <form name="fsearch" id="fsearch" method="get" class="brd-search-box">
            <select name="sfl" id="sfl" class="brd-select">
                <option value="bo_table" <?php echo get_selected($sfl, "bo_table", true); ?>>TABLE</option>
                <option value="bo_subject" <?php echo get_selected($sfl, "bo_subject"); ?>>제목</option>
                <option value="a.gr_id" <?php echo get_selected($sfl, "a.gr_id"); ?>>그룹ID</option>
            </select>
            <input type="text" name="stx" value="<?php echo $stx ?>" id="stx" required class="brd-input-text" placeholder="검색어 입력">
            <button type="submit" class="brd-btn-search">검색</button>
            <a href="<?php echo $_SERVER['SCRIPT_NAME'] ?>" class="brd-btn-list">전체목록</a>
        </form>
    </div>

    <form name="fboardlist" id="fboardlist" action="./board_list_update.php" onsubmit="return fboardlist_submit(this);" method="post">
        <input type="hidden" name="sst" value="<?php echo $sst ?>">
        <input type="hidden" name="sod" value="<?php echo $sod ?>">
        <input type="hidden" name="sfl" value="<?php echo $sfl ?>">
        <input type="hidden" name="stx" value="<?php echo $stx ?>">
        <input type="hidden" name="page" value="<?php echo $page ?>">
        <input type="hidden" name="token" value="<?php echo isset($token) ? $token : ''; ?>">

        <div class="brd-list-wrap">
            
            <div class="brd-grid-row brd-list-head">
                <div class="brd-col"><input type="checkbox" name="chkall" value="1" id="chkall" onclick="check_all(this.form)"></div>
                <div class="brd-col"><?php echo subject_sort_link('a.gr_id') ?>그룹</a></div>
                <div class="brd-col"><?php echo subject_sort_link('bo_table') ?>TABLE</a></div>
                <div class="brd-col"><?php echo subject_sort_link('bo_skin', '', 'desc') ?>스킨</a></div>
                <div class="brd-col"><?php echo subject_sort_link('bo_mobile_skin', '', 'desc') ?>M스킨</a></div>
                <div class="brd-col"><?php echo subject_sort_link('bo_subject') ?>제목</a></div>
                <div class="brd-col">읽기</div>
                <div class="brd-col">쓰기</div>
                <div class="brd-col">댓글</div>
                <div class="brd-col">다운</div>
                <div class="brd-col">SNS</div>
                <div class="brd-col">검색</div>
                <div class="brd-col">순서</div>
                <div class="brd-col">기기</div>
                <div class="brd-col">관리</div>
            </div>

            <?php
            for ($i = 0; $row = sql_fetch_array($result); $i++) {
            ?>
            <div class="brd-grid-row brd-list-row">
                <div class="brd-col">
                    <input type="checkbox" name="chk[]" value="<?php echo $i ?>" id="chk_<?php echo $i ?>">
                </div>
                
                <div class="brd-col">
                    <?php if ($is_admin == 'super') { ?>
                        <?php echo get_group_select("gr_id[$i]", $row['gr_id']) ?>
                    <?php } else { ?>
                        <input type="hidden" name="gr_id[<?php echo $i ?>]" value="<?php echo $row['gr_id'] ?>"><?php echo $row['gr_subject'] ?>
                    <?php } ?>
                </div>

                <div class="brd-col">
                    <input type="hidden" name="board_table[<?php echo $i ?>]" value="<?php echo $row['bo_table'] ?>">
                    <a href="<?php echo get_pretty_url($row['bo_table']) ?>" target="_blank" class="link-table"><?php echo $row['bo_table'] ?></a>
                </div>

                <div class="brd-col">
                    <?php echo get_skin_select('board', 'bo_skin_' . $i, "bo_skin[$i]", $row['bo_skin']); ?>
                </div>

                <div class="brd-col">
                    <?php echo get_mobile_skin_select('board', 'bo_mobile_skin_' . $i, "bo_mobile_skin[$i]", $row['bo_mobile_skin']); ?>
                </div>

                <div class="brd-col">
                    <input type="text" name="bo_subject[<?php echo $i ?>]" value="<?php echo get_text($row['bo_subject']) ?>" id="bo_subject_<?php echo $i ?>" required class="brd-input-sm full_input">
                </div>

                <div class="brd-col">
                    <input type="text" name="bo_read_point[<?php echo $i ?>]" value="<?php echo $row['bo_read_point'] ?>" class="brd-input-sm">
                </div>

                <div class="brd-col">
                    <input type="text" name="bo_write_point[<?php echo $i ?>]" value="<?php echo $row['bo_write_point'] ?>" class="brd-input-sm">
                </div>

                <div class="brd-col">
                    <input type="text" name="bo_comment_point[<?php echo $i ?>]" value="<?php echo $row['bo_comment_point'] ?>" class="brd-input-sm">
                </div>

                <div class="brd-col">
                    <input type="text" name="bo_download_point[<?php echo $i ?>]" value="<?php echo $row['bo_download_point'] ?>" class="brd-input-sm">
                </div>

                <div class="brd-col">
                    <input type="checkbox" name="bo_use_sns[<?php echo $i ?>]" value="1" <?php echo $row['bo_use_sns'] ? "checked" : "" ?>>
                </div>

                <div class="brd-col">
                    <input type="checkbox" name="bo_use_search[<?php echo $i ?>]" value="1" <?php echo $row['bo_use_search'] ? "checked" : "" ?>>
                </div>

                <div class="brd-col">
                    <input type="text" name="bo_order[<?php echo $i ?>]" value="<?php echo $row['bo_order'] ?>" class="brd-input-sm">
                </div>

                <div class="brd-col">
                    <select name="bo_device[<?php echo $i ?>]" id="bo_device_<?php echo $i ?>">
                        <option value="both" <?php echo get_selected($row['bo_device'], 'both', true); ?>>모두</option>
                        <option value="pc" <?php echo get_selected($row['bo_device'], 'pc'); ?>>PC</option>
                        <option value="mobile" <?php echo get_selected($row['bo_device'], 'mobile'); ?>>모바일</option>
                    </select>
                </div>

                <div class="brd-col">
                    <div class="btn-manage-group">
                        <a href="./board_form.php?w=u&amp;bo_table=<?php echo $row['bo_table'] ?>&amp;<?php echo $qstr ?>" class="btn-mini">수정</a>
                        <a href="./board_copy.php?bo_table=<?php echo $row['bo_table'] ?>" class="board_copy btn-mini copy" target="win_board_copy">복사</a>
                    </div>
                </div>
            </div>
            <?php } ?>

            <?php if ($i == 0) { ?>
            <div style="padding: 50px 0; text-align: center; color: #999; border-bottom:1px solid #f1f1f1;">
                생성된 게시판이 없습니다.
            </div>
            <?php } ?>

        </div>

        <div class="brd-bottom-fixed">
            <div class="left-btn">
                <input type="submit" name="act_button" value="선택수정" onclick="document.pressed=this.value" class="btn-action btn-save">
                <?php if ($is_admin == 'super') { ?>
                    <input type="submit" name="act_button" value="선택삭제" onclick="document.pressed=this.value" class="btn-action btn-del">
                <?php } ?>
            </div>
            
            <?php if ($is_admin == 'super') { ?>
                <a href="./board_form.php" class="btn-action btn-add">
                    <span style="font-size:18px; line-height:1;">+</span> 게시판 추가
                </a>
            <?php } ?>
        </div>

    </form>
    
    <div class="brd-paging-wrap">
        <?php echo get_paging(G5_IS_MOBILE ? $config['cf_mobile_pages'] : $config['cf_write_pages'], $page, $total_page, $_SERVER['SCRIPT_NAME'] . '?' . $qstr . '&amp;page='); ?>
    </div>
</div>

<script>
    function fboardlist_submit(f) {
        if (!is_checked("chk[]")) {
            alert(document.pressed + " 하실 항목을 하나 이상 선택하세요.");
            return false;
        }

        if (document.pressed == "선택삭제") {
            if (!confirm("선택한 자료를 정말 삭제하시겠습니까?")) {
                return false;
            }
        }

        return true;
    }

    $(function() {
        $(".board_copy").click(function() {
            window.open(this.href, "win_board_copy", "left=100,top=100,width=550,height=450");
            return false;
        });
    });
</script>

<?php
require_once './admin.tail.php';
?>