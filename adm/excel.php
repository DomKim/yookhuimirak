<?php
include_once ("../common.php");

// [1] 관리자 권한 체크 (필요시 주석 해제)
// if (!$is_admin) { alert("관리자만 접근 가능합니다."); exit; }

// [2] 기본 설정
$bo_table = isset($_REQUEST['bo_table']) ? $_REQUEST['bo_table'] : 'email_data';
$excel_down = 'g5_email_data'; 
$file_name = "문의내역_".date('Ymd_His');

// [3] 엑셀 헤더 설정
header("Content-type: application/vnd.ms-excel; charset=utf-8");
header("Content-Disposition: attachment; filename={$file_name}.xls");
header("Content-Description: PHP4 Generated Data");
header("Pragma: no-cache");
header("Expires: 0");

// [4] 검색 조건
$search_sql = " where 1 ";
if (isset($_POST['date1']) && $_POST['date1']) {
    $search_sql .= " and regDate >= '{$_POST['date1']} 00:00:00' ";
}
if (isset($_POST['date2']) && $_POST['date2']) {
    $search_sql .= " and regDate <= '{$_POST['date2']} 23:59:59' ";
}

// [5] 데이터 조회
$sql = " select * from {$excel_down} {$search_sql} order by regDate desc ";
$result = sql_query($sql);
?>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
.txt { mso-number-format:"\@"; border:0.5pt solid #000; text-align:center; vertical-align:middle; }
.bg { background-color:#f2f2f2; font-weight:bold; border:0.5pt solid #000; text-align:center; vertical-align:middle; }
.long-txt { text-align:left; padding:5px; white-space: pre-wrap; }
</style>
</head>
<body>
<table>
    <tr>
        <td class='bg'>접수일시</td>
        <td class='bg'>성함</td>
        <td class='bg'>연락처</td>
        <td class='bg'>상가보유</td>
        <td class='bg'>희망지역</td>
        <td class='bg'>희망시기</td>
        <td class='bg'>문의내용</td>
        <td class='bg'>접수경로</td>
        <td class='bg'>담당자</td>
        <td class='bg'>메모</td>
    </tr>

    <?php
    while ($row = sql_fetch_array($result)) {
        $date     = $row['regDate'];
        $name     = $row['name'];
        $phone    = $row['phone'];
        $store    = isset($row['wr_2']) ? $row['wr_2'] : '';     // 상가보유
        $location = $row['location'];                            // 희망지역
        $when     = $row['budget'];                              // 희망시기
        $content  = $row['content'];                             // 문의내용
        $source   = isset($row['wr_5']) ? $row['wr_5'] : '';     // 접수경로 (con19/footer_quick)
        $source_label = $source === 'footer_quick' ? '하단 고정 폼' : ($source === 'con19' ? '메인 창업문의 폼' : $source);
        $manager  = isset($row['wr_6']) ? $row['wr_6'] : '';     // 담당자
        $memo     = isset($row['wr_3']) ? $row['wr_3'] : '';     // 메모

        echo "
        <tr>
            <td class='txt'>{$date}</td>
            <td class='txt'>{$name}</td>
            <td class='txt'>{$phone}</td>
            <td class='txt'>{$store}</td>
            <td class='txt'>{$location}</td>
            <td class='txt'>{$when}</td>
            <td class='txt long-txt'>{$content}</td>
            <td class='txt'>{$source_label}</td>
            <td class='txt'>{$manager}</td>
            <td class='txt long-txt'>{$memo}</td>
        </tr>
        ";
    }
    ?>
</table>
</body>
</html>