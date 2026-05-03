<?php
require_once './_common.php';
require_once G5_LIB_PATH . '/mailer.lib.php';

/* ===== 미락육회막국수 통합 문의 처리 =====
   con19 (창업문의 폼)        : c19_name / c19_phone / c19_store / c19_area / c19_when / c19_msg / c19_consent
   footer quick (하단 고정 폼) : name / tel1 / area / agree
*/

$source = isset($_POST['source']) ? $_POST['source'] : 'con19';

// 통합 매핑 — con19 우선, 없으면 footer quick fallback
$name    = trim(isset($_POST['c19_name'])    ? $_POST['c19_name']    : (isset($_POST['name'])  ? $_POST['name']  : ''));
$phone   = trim(isset($_POST['c19_phone'])   ? $_POST['c19_phone']   : (isset($_POST['tel1'])  ? $_POST['tel1']  : ''));
$store   = trim(isset($_POST['c19_store'])   ? $_POST['c19_store']   : '');
$area    = trim(isset($_POST['c19_area'])    ? $_POST['c19_area']    : (isset($_POST['area'])  ? $_POST['area']  : ''));
$when    = trim(isset($_POST['c19_when'])    ? $_POST['c19_when']    : '');
$msg     = trim(isset($_POST['c19_msg'])     ? $_POST['c19_msg']     : '');
$consent = isset($_POST['c19_consent']) || isset($_POST['agree']);

// 서버측 validate
$errors = [];
if ($name === '')                        $errors[] = '성함';
if ($phone === '')                       $errors[] = '연락처';
if (!preg_match('/^0\d{1,2}-?\d{3,4}-?\d{4}$/', $phone)) $errors[] = '연락처 형식';
if ($source === 'con19' && $store === '')$errors[] = '상가보유';
if (!$consent)                           $errors[] = '개인정보 동의';

if (!empty($errors)) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'msg' => '필수 항목 누락: ' . implode(', ', $errors)]);
    exit;
}

// 메일 본문 (모든 필드)
$rows = [
    ['성함',     $name],
    ['연락처',   $phone],
    ['상가보유', $store ?: '-'],
    ['희망지역', $area  ?: '-'],
    ['희망시기', $when  ?: '-'],
    ['문의내용', nl2br(htmlspecialchars($msg)) ?: '-'],
    ['접수경로', $source === 'con19' ? '메인 창업문의 폼' : '하단 고정 폼'],
];
$row_html = '';
$alt = true;
foreach ($rows as $r) {
    $bg = $alt ? '#f8edd7' : '#fff';
    $alt = !$alt;
    $row_html .= '<tr><th style="text-align:left; padding:14px 18px; background:'.$bg.'; color:#5d2b0d; font-size:13px; font-weight:600; width:120px; border-bottom:1px solid #eee;">'.$r[0].'</th>'
              . '<td style="padding:14px 18px; background:'.$bg.'; color:#222; font-size:14px; border-bottom:1px solid #eee;">'.$r[1].'</td></tr>';
}

$title = '[미락육회막국수] 창업문의 - ' . $name . '님';

$content = '
<div style="font-family:\'Pretendard\',\'Segoe UI\',Arial,sans-serif; max-width:650px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
  <div style="background:#231916; color:#f8edd7; padding:24px; text-align:center;">
    <h2 style="margin:0; font-size:22px; letter-spacing:1px;">미락육회막국수</h2>
    <p style="margin:6px 0 0; font-size:14px; opacity:0.9;">창업 문의 접수 알림</p>
  </div>
  <div style="padding:24px;">
    <table style="width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden;">'.$row_html.'</table>
    <p style="margin-top:24px; font-size:12px; color:#777; text-align:center; border-top:1px dashed #eee; padding-top:12px;">
      ※ 본 메일은 자동 발송된 안내 메일입니다. 신속히 회신 부탁드립니다.
    </p>
  </div>
</div>';

// 메일 발송 (수신: guswhd7894@naver.com, 발신: 사이트)
$send_to   = 'guswhd7894@naver.com';
$send_from = 'ccw9103@naver.com';
mailer($name, $send_from, $send_to, $title, $content, 1);

// DB 저장 — g5_email_data
//   name=성함 / phone=연락처 / location=희망지역 / budget=희망시기 / content=문의내용
//   wr_2=상가보유 / wr_5=접수경로(con19|footer)
$name_e    = sql_real_escape_string($name);
$phone_e   = sql_real_escape_string($phone);
$store_e   = sql_real_escape_string($store);
$area_e    = sql_real_escape_string($area);
$when_e    = sql_real_escape_string($when);
$msg_e     = sql_real_escape_string($msg);
$source_e  = sql_real_escape_string($source);

$sql = " insert into g5_email_data
            set name     = '$name_e',
                phone    = '$phone_e',
                location = '$area_e',
                budget   = '$when_e',
                content  = '$msg_e',
                wr_2     = '$store_e',
                wr_5     = '$source_e' ";
sql_query($sql);

// 응답 (JSON or redirect)
if (!empty($_POST['ajax'])) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'msg' => '문의가 정상 접수되었습니다.']);
    exit;
}

echo '<script>alert("문의가 정상 접수되었습니다. 빠른 시일 내 연락드리겠습니다."); location.href="/";</script>';
