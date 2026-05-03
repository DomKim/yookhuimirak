<?php
$sub_menu = '800100';
include_once('./_common.php');
include_once(G5_LIB_PATH.'/visit.lib.php');

auth_check_menu($auth, $sub_menu, 'r');

$g5['title'] = '창업문의 확인';
include_once('./admin.head.php');
include_once(G5_PLUGIN_PATH.'/jquery-ui/datepicker.php');

// [폰트 로드]
echo '<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />';

// [테마 컬러 설정]
$mode_color = "#3235cd"; 

// [1] DB 테이블 자동 생성
if (!sql_query(" DESCRIBE g5_email_data", false)) {
    sql_query("CREATE TABLE `g5_email_data` ( `id` int(11) NOT NULL AUTO_INCREMENT, `name` varchar(100) DEFAULT NULL, `phone` varchar(100) DEFAULT NULL, `location` varchar(100) DEFAULT NULL, `budget` varchar(100) DEFAULT NULL, `wr_2` varchar(100) DEFAULT NULL, `wr_3` varchar(100) DEFAULT NULL, `wr_4` varchar(100) DEFAULT NULL, `wr_5` varchar(100) DEFAULT NULL, `wr_6` varchar(100) DEFAULT NULL, `wr_7` varchar(100) DEFAULT NULL, `content` blob, `manager` varchar(100) DEFAULT NULL, `regDate` timestamp DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`) ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8", true);
}

// [2] 데이터 조회
$sql = " select count(*) as cnt from g5_email_data ";
$row = sql_fetch($sql);
$total_count = $row['cnt'];
$rows = $config['cf_page_rows'];
$total_page  = ceil($total_count / $rows);
if ($page < 1) $page = 1;
$from_record = ($page - 1) * $rows;

$sql2 = " select * from g5_email_data order by regDate desc limit {$from_record}, {$rows}";
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
            <h2 style="font-size:22px; font-weight:800; color:#222; margin:0 0 5px 0;">창업 문의 내역</h2>
            <span style="font-size:14px; color:#888;">총 <b style="color:<?php echo $mode_color ?>"><?php echo number_format($total_count) ?></b>건의 문의가 접수되었습니다.</span>
        </div>
        
        <a href='/adm/excel.php?bo_table=email_data' class="btn_admin btn2" target='_blank' style="background:#fff; border:1px solid #ddd; padding:10px 20px; border-radius:10px; color:#555; text-decoration:none; font-size:14px; font-weight:700; box-shadow:0 2px 5px rgba(0,0,0,0.03); display:flex; align-items:center; gap:6px;">
            <i class="fa fa-download"></i> 엑셀 다운로드
        </a>
    </div>

    <div class="inquiry-list accordion-list">
        <?php while($row = sql_fetch_array($result2)) { ?>
            <div class="accordion-card">
                <div class="accordion-header">
                    <div style="font-weight:700; color:<?php echo $mode_color ?>; font-size:15px; display:flex; align-items:center; gap:8px;">
                        <span style="width:8px; height:8px; background:<?php echo $mode_color ?>; border-radius:50%; display:inline-block;"></span>
                        <?php echo $row['name']; ?>님
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:12px; color:#999; font-weight:500;"><?php echo substr($row['regDate'], 5, 5); ?></span>
                        <div class="toggle-icon"><i class="fa fa-chevron-down"></i></div>
                    </div>
                </div>
                <div class="accordion-body">
                    <form onsubmit="return updateInquiry(this);">
                        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                        <div class="info-row" style="margin-bottom: 20px;">
                            <span class="label" style="color:<?php echo $mode_color ?>;">담당자</span>
                            <input type="text" name="wr_6" class="edit-input" value="<?php echo $row['wr_6']; ?>" placeholder="담당자 이름을 배정해주세요">
                        </div>
                        <div class="info-row"><span class="label">연락처</span><span class="value"><?php echo $row['phone']; ?></span></div>
                        <div class="info-row"><span class="label">지역</span><span class="value"><?php echo $row['location']; ?></span></div>
                        <div class="info-row"><span class="label">창업형태</span><span class="value"><?php echo $row['budget']; ?></span></div>
                        <div class="info-row"><span class="label">유입경로</span><span class="value"><?php echo $row['content']; ?></span></div>
                        <div class="info-row" style="margin-top:20px;">
                            <span class="label">상세 내용</span>
                            <textarea name="wr_3" class="edit-textarea"><?php echo $row['wr_3']; ?></textarea>
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
                접수된 문의 내역이 없습니다.
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

// [JS] 삭제 기능 (보내주신 HTML onclick="deleteInquiry"에 대응)
function deleteInquiry(id) {
    if(confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) {
        $.post("/bbs/maildelete.php", { wr_id: id }, function() {
            alert("삭제되었습니다."); location.reload();
        });
    }
}

// [JS] 수정(저장) 기능 (보내주신 HTML onsubmit="return updateInquiry"에 대응)
function updateInquiry(form) {
    if(!confirm("수정된 내용을 저장하시겠습니까?")) return false;
    $.ajax({
        url: "/bbs/mailupdate.php",
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