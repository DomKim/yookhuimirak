<?php
$sub_menu = '800200';
include_once('./_common.php');
include_once(G5_LIB_PATH.'/visit.lib.php');

// ★★★ [1] 엑셀 다운로드 로직 (파일 내장) ★★★
if (isset($_GET['act']) && $_GET['act'] == 'excel_down') {
    $file_name = "입점제안문의_".date('Ymd_His');
    
    header("Content-type: application/vnd.ms-excel; charset=utf-8");
    header("Content-Disposition: attachment; filename={$file_name}.xls");
    header("Content-Description: PHP4 Generated Data");
    header("Pragma: no-cache");
    header("Expires: 0");

    $sql = " select * from g5_email_data2 order by regDate desc ";
    $result = sql_query($sql);

    echo '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    echo '<style>.txt{mso-number-format:"\@";border:0.5pt solid #000;text-align:center;vertical-align:middle;}';
    echo '.bg{background-color:#f2f2f2;font-weight:bold;border:0.5pt solid #000;text-align:center;vertical-align:middle;}</style>';
    echo '</head><body><table>';
    
    // 헤더 출력
    echo '<tr>
            <td class="bg">접수일시</td>
            <td class="bg">이름</td>
            <td class="bg">담당자</td>
            <td class="bg">연락처</td>
            <td class="bg">이메일</td>
            <td class="bg">상가유무</td>
            <td class="bg">제안위치</td>
            <td class="bg">제목</td>
            <td class="bg">문의내용</td>
          </tr>';

    // 데이터 출력
    while ($row = sql_fetch_array($result)) {
        // manager 컬럼이 없을 경우를 대비해 예외처리
        $manager = isset($row['manager']) ? $row['manager'] : '';
        echo "<tr>
                <td class='txt'>{$row['regDate']}</td>
                <td class='txt'>{$row['name']}</td>
                <td class='txt'>{$manager}</td>
                <td class='txt'>{$row['phone']}</td>
                <td class='txt'>{$row['wr_2']}</td>
                <td class='txt'>{$row['budget']}</td>
                <td class='txt'>{$row['location']}</td>
                <td class='txt'>{$row['wr_3']}</td>
                <td class='txt' style='text-align:left; padding:5px;'>{$row['content']}</td>
            </tr>";
    }
    echo '</table></body></html>';
    exit;
}
// ★★★ 엑셀 로직 끝 ★★★

auth_check_menu($auth, $sub_menu, 'r');

$g5['title'] = '입점제안 문의 확인';
include_once('./admin.head.php');
include_once(G5_PLUGIN_PATH.'/jquery-ui/datepicker.php');

// [폰트 로드]
echo '<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />';

// [테마 컬러]
$mode_color = "#3235cd"; 

// [2] DB 테이블 자동 생성 (manager 컬럼 추가)
if (!sql_query(" DESCRIBE g5_email_data2", false)) {
    sql_query("CREATE TABLE `g5_email_data2` ( 
        `id` int(11) NOT NULL AUTO_INCREMENT, 
        `name` varchar(100) DEFAULT NULL, 
        `phone` varchar(100) DEFAULT NULL, 
        `location` varchar(100) DEFAULT NULL, 
        `budget` varchar(100) DEFAULT NULL, 
        `wr_2` varchar(100) DEFAULT NULL, 
        `wr_3` varchar(100) DEFAULT NULL, 
        `wr_4` varchar(100) DEFAULT NULL, 
        `wr_5` varchar(100) DEFAULT NULL, 
        `wr_6` varchar(100) DEFAULT NULL, 
        `wr_7` varchar(100) DEFAULT NULL, 
        `content` blob, 
        `manager` varchar(100) DEFAULT NULL, 
        `regDate` timestamp DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (`id`) 
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8", true);
}

// 혹시 manager 컬럼이 없는 구버전 테이블일 경우를 대비해 컬럼 추가 시도
@sql_query(" ALTER TABLE `g5_email_data2` ADD `manager` VARCHAR(100) NULL AFTER `content` ", false);


// [3] 데이터 조회
$sql = " select count(*) as cnt from g5_email_data2 ";
$row = sql_fetch($sql);
$total_count = $row['cnt'];
$rows = $config['cf_page_rows'];
$total_page  = ceil($total_count / $rows);
if ($page < 1) $page = 1;
$from_record = ($page - 1) * $rows;

$sql2 = " select * from g5_email_data2 order by regDate desc limit {$from_record}, {$rows}";
$result2= sql_query($sql2);
?>

<style>
    .inquiry-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
    .edit-textarea { height: 120px; line-height: 1.6; resize: vertical; }
    .pagination { margin-top: 40px; text-align: center; }
</style>

<section>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding: 0 5px;">
        <div>
            <h2 style="font-size:22px; font-weight:800; color:#222; margin:0 0 5px 0;">입점 제안 문의</h2>
            <span style="font-size:14px; color:#888;">총 <b style="color:<?php echo $mode_color ?>"><?php echo number_format($total_count) ?></b>건의 제안이 접수되었습니다.</span>
        </div>
        
        <a href='?act=excel_down' class="btn_admin btn2" target='_blank' style="background:#fff; border:1px solid #ddd; padding:10px 20px; border-radius:10px; color:#555; text-decoration:none; font-size:14px; font-weight:700; box-shadow:0 2px 5px rgba(0,0,0,0.03); display:flex; align-items:center; gap:6px;">
            <i class="fa fa-download"></i> 엑셀 다운로드
        </a>
    </div>

    <div class="inquiry-list accordion-list">
        <?php while($row = sql_fetch_array($result2)) { 
            // manager 필드 예외처리
            $manager = isset($row['manager']) ? $row['manager'] : '';
        ?>
            <div class="accordion-card">
                <div class="accordion-header">
                    <div style="font-weight:700; color:<?php echo $mode_color ?>; font-size:16px; display:flex; align-items:center; gap:10px;">
                        <span style="width:10px; height:10px; background:<?php echo $mode_color ?>; border-radius:50%; display:inline-block;"></span>
                        <?php echo $row['name']; ?> 님
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <span style="font-size:13px; color:#999; font-weight:500;">
                            <?php echo substr($row['regDate'], 0, 16); ?>
                        </span>
                        <div class="toggle-icon"><i class="fa fa-chevron-down"></i></div>
                    </div>
                </div>

                <div class="accordion-body">
                    <form onsubmit="return updateInquiry(this);">
                        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                        
                        <div class="info-row" style="margin-bottom: 20px;">
                            <span class="label" style="color:<?php echo $mode_color ?>;">담당자</span>
                            <input type="text" name="manager" class="edit-input" value="<?php echo $manager; ?>" placeholder="담당자 이름을 배정해주세요">
                        </div>
                        
                        <div class="info-row"><span class="label">연락처</span><span class="value"><?php echo $row['phone']; ?></span></div>
                        <div class="info-row"><span class="label">이메일</span><span class="value"><?php echo $row['wr_2']; ?></span></div>
                        <div class="info-row"><span class="label">상가유무</span><span class="value"><?php echo $row['budget']; ?></span></div>
                        <div class="info-row"><span class="label">제안위치</span><span class="value"><?php echo $row['location']; ?></span></div>
                        <div class="info-row"><span class="label">제목</span><span class="value"><?php echo $row['wr_3']; ?></span></div>
                        
                        <div class="info-row" style="margin-top:20px; display:block;">
                            <span class="label" style="display:block; margin-bottom:8px;">문의 내용</span>
                            <textarea name="content" class="edit-textarea"><?php echo $row['content']; ?></textarea>
                        </div>
                        
                        <div class="btn-wrap">
                            <button type="button" class="btn-del" onclick="deleteInquiry(<?php echo $row['id']; ?>)">삭제</button>
                            <button type="submit" class="btn-save">수정 내용 저장</button>
                        </div>
                    </form>
                </div>
            </div>
        <?php } ?>

        <?php if ($total_count == 0) { ?>
            <div style="text-align:center; padding:60px; background:#fff; border-radius:16px; color:#999; border:1px solid #eee;">
                <i class="fa fa-inbox" style="font-size:40px; margin-bottom:15px; display:block; opacity:0.3;"></i>
                접수된 내역이 없습니다.
            </div>
        <?php } ?>
    </div>

    <div class="pagination">
        <?php echo get_paging($config['cf_write_pages'], $page, $total_page, $_SERVER['SCRIPT_NAME'].'?'.$qstr.'&amp;page='); ?>
    </div>
</section>

<script>
// [JS] 아코디언 토글
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
        let body = this.nextElementSibling;
        let icon = this.querySelector('.toggle-icon');
        body.classList.toggle("open");
        icon.classList.toggle("open");
    });
});

// [JS] 삭제 기능 (기존 maildelete2.php 연결)
function deleteInquiry(id) {
    if(confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) {
        $.post("/bbs/maildelete2.php", { wr_id: id }, function() {
            alert("삭제되었습니다."); location.reload();
        });
    }
}

// [JS] 수정(저장) 기능 (mailupdate2.php 연결)
// ★ 주의: /bbs/mailupdate2.php 파일이 존재해야 하며, g5_email_data2 테이블을 업데이트하도록 되어 있어야 합니다.
function updateInquiry(form) {
    if(!confirm("수정된 내용을 저장하시겠습니까?")) return false;
    $.ajax({
        url: "/bbs/mailupdate2.php",
        type: "post",
        data: $(form).serialize(),
        success: function(data) {
            alert("저장되었습니다."); location.reload();
        },
        error: function() { alert("저장 실패. 관리자에게 문의하세요."); }
    });
    return false;
}
</script>

<?php
include_once('./admin.tail.php');
?>