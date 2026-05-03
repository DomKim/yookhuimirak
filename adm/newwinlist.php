<?php
$sub_menu = '600110';
require_once './_common.php';

auth_check_menu($auth, $sub_menu, "r");

if (!isset($g5['new_win_table'])) {
    die('<meta charset="utf-8">/data/dbconfig.php 파일에 <strong>$g5[\'new_win_table\'] = G5_TABLE_PREFIX.\'new_win\';</strong> 를 추가해 주세요.');
}
//내용(컨텐츠)정보 테이블이 있는지 검사한다.
if (!sql_query(" DESCRIBE {$g5['new_win_table']} ", false)) {
    if (sql_query(" DESCRIBE {$g5['g5_shop_new_win_table']} ", false)) {
        sql_query(" ALTER TABLE {$g5['g5_shop_new_win_table']} RENAME TO `{$g5['new_win_table']}` ;", false);
    } else {
        $query_cp = sql_query(
            " CREATE TABLE IF NOT EXISTS `{$g5['new_win_table']}` (
                      `nw_id` int(11) NOT NULL AUTO_INCREMENT,
                      `nw_division` varchar(10) NOT NULL DEFAULT 'both',
                      `nw_device` varchar(10) NOT NULL DEFAULT 'both',
                      `nw_begin_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
                      `nw_end_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
                      `nw_disable_hours` int(11) NOT NULL DEFAULT '0',
                      `nw_left` int(11) NOT NULL DEFAULT '0',
                      `nw_top` int(11) NOT NULL DEFAULT '0',
                      `nw_height` int(11) NOT NULL DEFAULT '0',
                      `nw_width` int(11) NOT NULL DEFAULT '0',
                      `nw_subject` text NOT NULL,
                      `nw_content` text NOT NULL,
                      `nw_content_html` tinyint(4) NOT NULL DEFAULT '0',
                      PRIMARY KEY (`nw_id`)
                    ) ENGINE=MyISAM DEFAULT CHARSET=utf8 ",
            true
        );
    }
}

$g5['title'] = '팝업레이어 관리';
require_once G5_ADMIN_PATH . '/admin.head.php';

$sql_common = " from {$g5['new_win_table']} ";

// 테이블의 전체 레코드수만 얻음
$sql = " select count(*) as cnt " . $sql_common;
$row = sql_fetch($sql);
$total_count = $row['cnt'];

$sql = "select * $sql_common order by nw_id desc ";
$result = sql_query($sql);
?>

<style>
    /* 상단 정보 및 버튼 영역 */
    .vst-top-area {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 10px;
    }

    .vst-total-count {
        font-size: 15px;
        font-weight: 600;
        color: #555;
    }
    .vst-total-count b { color: #3235cd; }

    .vst-btn-add {
        background: #3235cd;
        color: #fff !important;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        transition: 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    .vst-btn-add:hover {
        background: #2629a8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(50, 53, 205, 0.3);
    }

    /* 컬럼 스타일 */
    .col-id { width: 60px; text-align: center; color: #888; font-size: 13px; }

    .col-subject {
        flex: 1;
        padding: 0 15px;
        font-weight: 600;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .col-device { width: 100px; text-align: center; }
    .col-period { width: 280px; text-align: center; color: #666; font-size: 13px; }
    .col-status { width: 80px; text-align: center; }
    .col-info { width: 150px; text-align: center; color: #888; font-size: 12px; }
    .col-manage { width: 140px; text-align: center; display: flex; gap: 5px; justify-content: center; }

    /* 반응형 */
    @media (max-width: 900px) {
        .col-id { display: none; }
        .col-subject { width: 100%; padding: 0; font-size: 15px; }

        .row-meta { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; align-items: center; }
        .col-device, .col-status, .col-info { width: auto; text-align: left; }
        .col-period { width: 100%; text-align: left; margin-top: 5px; background: #f9f9f9; padding: 8px; border-radius: 6px; }

        .col-manage { width: 100%; justify-content: flex-end; margin-top: 10px; }
    }
</style>

<div class="vst-layout-container">

    <div class="vst-top-area">
        <div class="vst-total-count">
            전체 <b><?php echo number_format($total_count) ?></b>건
        </div>
        <a href="./newwinform.php" class="vst-btn-add">
            <span>+</span> 팝업 추가
        </a>
    </div>
    
    <div class="vst-list-header">
        <div class="col-id">번호</div>
        <div class="col-subject">제목</div>
        <div class="col-device">접속기기</div>
        <div class="col-status">상태</div>
        <div class="col-period">노출 기간</div>
        <div class="col-info">크기/위치</div>
        <div class="col-manage">관리</div>
    </div>

    <?php
    $has_data = false;
    for ($i = 0; $row = sql_fetch_array($result); $i++) {
        $has_data = true;
        
        // 기기 구분
        switch ($row['nw_device']) {
            case 'pc': $device_badge = '<span class="vst-badge badge-pc">PC</span>'; break;
            case 'mobile': $device_badge = '<span class="vst-badge badge-mobile">Mobile</span>'; break;
            default: $device_badge = '<span class="vst-badge badge-both">ALL</span>'; break;
        }

        // 상태 계산 (진행중/종료/대기)
        $now = G5_TIME_YMDHIS;
        $status_badge = '';
        if($row['nw_end_time'] < $now) {
            $status_badge = '<span class="vst-badge status-end">종료</span>';
        } elseif($row['nw_begin_time'] > $now) {
            $status_badge = '<span class="vst-badge status-wait">대기</span>';
        } else {
            $status_badge = '<span class="vst-badge status-running">진행중</span>';
        }
        
        // 날짜 포맷팅 (초 단위 제거)
        $begin_time = substr($row['nw_begin_time'], 2, 14);
        $end_time = substr($row['nw_end_time'], 2, 14);
    ?>
    <div class="vst-list-row">
        <div class="col-id"><?php echo $row['nw_id'] ?></div>
        
        <div class="col-subject">
            <?php echo $row['nw_subject'] ?>
        </div>
        
        <div class="row-meta" style="display:contents;"> <div class="col-device">
                <?php echo $device_badge ?>
            </div>
            
            <div class="col-status">
                <?php echo $status_badge ?>
            </div>

            <div class="col-period">
                <?php echo $begin_time ?> ~ <?php echo $end_time ?>
                <div style="font-size:11px; color:#999; margin-top:2px;">(<?php echo $row['nw_disable_hours'] ?>시간 동안 다시 열지 않음)</div>
            </div>
            
            <div class="col-info">
                W:<?php echo $row['nw_width'] ?> / H:<?php echo $row['nw_height'] ?><br>
                T:<?php echo $row['nw_top'] ?> / L:<?php echo $row['nw_left'] ?>
            </div>
        </div>

        <div class="col-manage">
            <a href="./newwinform.php?w=u&amp;nw_id=<?php echo $row['nw_id']; ?>" class="btn-edit">수정</a>
            <a href="./newwinformupdate.php?w=d&amp;nw_id=<?php echo $row['nw_id']; ?>" onclick="return delete_confirm(this);" class="btn-del">삭제</a>
        </div>
    </div>
    <?php } ?>

    <?php if(!$has_data) { ?>
    <div style="text-align:center; padding:80px 0; color:#999;">
        <span style="display:block; font-size:40px; margin-bottom:10px;">🪟</span>
        등록된 팝업이 없습니다.
    </div>
    <?php } ?>

</div>

<script>
function delete_confirm(el) {
    if(confirm("한번 삭제한 자료는 복구할 수 없습니다.\n\n정말 삭제하시겠습니까?")) {
        return true;
    }
    return false;
}
</script>

<?php
require_once G5_ADMIN_PATH . '/admin.tail.php';
?>