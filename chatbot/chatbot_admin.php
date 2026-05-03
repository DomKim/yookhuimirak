<?php
define('_GNUBOARD_', true);
define('G5_SET_DB', true);

$g5_path = array('path' => realpath(dirname(__FILE__).'/..'));
include_once($g5_path['path'].'/common.php');
sql_query("SET NAMES utf8mb4");

$is_admin_level = ($is_admin || (isset($member['mb_level']) && $member['mb_level'] >= 10));
if (!$is_admin_level) {
    echo '<script>alert("관리자만 접근 가능합니다.");history.back();</script>';
    exit;
}
// 마스터 = admin 계정만. admin02 등 다른 관리자 계정은 고객사로 취급.
$is_super = ($member['mb_id'] === 'admin');

// 테이블 자동 생성
sql_query("CREATE TABLE IF NOT EXISTS g5_chatbot_config (
    config_key VARCHAR(64) PRIMARY KEY,
    config_value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4", false);

sql_query("CREATE TABLE IF NOT EXISTS g5_chatbot_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64),
    role VARCHAR(20),
    message TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4", false);

sql_query("SET NAMES utf8mb4");

// ===== 설정 로드 헬퍼 =====
function get_cb_config($key, $default = '') {
    $safe_key = sql_real_escape_string($key);
    $row = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key = '{$safe_key}'");
    return isset($row['config_value']) ? $row['config_value'] : $default;
}

function set_cb_config($key, $val) {
    $safe_key = sql_real_escape_string($key);
    $safe_val = sql_real_escape_string($val);
    sql_query("INSERT INTO g5_chatbot_config (config_key, config_value) VALUES ('{$safe_key}', '{$safe_val}') ON DUPLICATE KEY UPDATE config_value='{$safe_val}'");
}

// 플랜 표시명 — 일반 플랜(개월) + 테스트 플랜(30초)
function cb_plan_label($plan) {
    if ($plan === 'test30s') return '⚡ 테스트 30초';
    if ($plan === '') return '-';
    return $plan . '개월';
}

// 플랜으로부터 만료 시각 계산
function cb_calc_expiry($plan) {
    if ($plan === 'test30s') return date('Y-m-d H:i:s', time() + 30);
    return date('Y-m-d H:i:s', strtotime("+{$plan} months"));
}

// ===== 만료 15일전 알림 이메일 (idempotent) =====
function check_and_send_expiry_alert() {
    $enabled = get_cb_config('enabled', '0');
    if ($enabled !== '1') return;

    $expires_at = get_cb_config('expires_at', '');
    if (!$expires_at) return;

    $notified = get_cb_config('expiry_notified', '0');
    if ($notified === '1') return; // 이미 보냈음 - 중복 발송 방지

    $expires_ts = strtotime($expires_at);
    if ($expires_ts === false) return;

    $now_ts = time();
    $seconds_left = $expires_ts - $now_ts;
    if ($seconds_left <= 0) return; // 이미 만료 - 알림 의미 없음

    // 일반 플랜: 15일 이내일 때만 발송
    // 테스트 플랜(test30s): 항상 발송 (30초짜리는 즉시 발송되어야 함)
    $plan_for_check = get_cb_config('plan', '');
    if ($plan_for_check !== 'test30s') {
        $days_left = (int)floor($seconds_left / 86400);
        if ($days_left > 15) return;
    }
    $days_left = (int)floor($seconds_left / 86400);

    // === 메일 발송 ===
    $brand_name = get_cb_config('brand_name', '러키비키');
    $plan = get_cb_config('plan', '');
    $started_at = get_cb_config('started_at', '');

    $to = 'vworks02@naver.com';
    $subject = "[{$brand_name}] AI 챗봇 서비스 만료 예정 — D-{$days_left}";
    $body  = "<h3 style='color:#f59e0b;'>AI 챗봇 서비스 만료 알림</h3>";
    $body .= "<table cellpadding='8' style='border-collapse:collapse;font-size:14px;'>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>고객사</td><td>" . htmlspecialchars($brand_name) . "</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>플랜</td><td>{$plan}" . ($plan === 'test30s' ? '' : '개월') . "</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>시작일</td><td>{$started_at}</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>만료일</td><td style='color:#dc2626;font-weight:700;'>{$expires_at}</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>남은 일수</td><td style='color:#dc2626;font-weight:700;'>{$days_left}일</td></tr>";
    $body .= "</table>";
    $body .= "<p style='margin-top:16px;'>고객에게 연장 의사를 확인해주세요.</p>";

    $sent = false;
    $mail_path = realpath(dirname(__FILE__).'/../plugin/PHPMailer/PHPMailerAutoload.php');
    if (file_exists($mail_path)) {
        require_once($mail_path);
        try {
            $mail = new PHPMailer();
            $mail->isSMTP();
            $mail->Host = 'smtp.naver.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'guswhd7894';
            $mail->Password = 'D7ET4KR9F29S';
            $mail->SMTPSecure = 'ssl';
            $mail->Port = 465;
            $mail->CharSet = 'UTF-8';
            $mail->setFrom('guswhd7894@naver.com', $brand_name . ' 시스템');
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $sent = @$mail->send();
        } catch (Exception $e) {
            $sent = false;
        }
    }

    // PHPMailer 실패 시 PHP mail() 폴백
    if (!$sent && function_exists('mail')) {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$brand_name} 시스템 <guswhd7894@naver.com>\r\n";
        $sent = @mail($to, $subject, $body, $headers);
    }

    if ($sent) {
        set_cb_config('expiry_notified', '1');
        set_cb_config('expiry_notified_at', date('Y-m-d H:i:s'));
    }
}

// 만료 감지 시 enabled 플래그를 자동 '0'으로 전환 (토글과 서비스 상태 일치)
function auto_disable_if_expired() {
    if (get_cb_config('enabled', '0') !== '1') return;
    $exp = get_cb_config('expires_at', '');
    if (!$exp) return;
    $ts = strtotime($exp);
    if ($ts === false) return;
    if ($ts <= time()) {
        set_cb_config('enabled', '0');
    }
}

// 순서 주의: 알림은 만료 "전"에만 발송되므로 먼저 체크 → 이후 자동 비활성 처리
check_and_send_expiry_alert();
auto_disable_if_expired();

// ===== 개별 세션 삭제 (POST only) =====
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (isset($_GET['action']) && $_GET['action'] === 'delete_session')) {
    $del_sid = sql_real_escape_string($_POST['sid'] ?? '');
    if ($del_sid !== '') {
        sql_query("DELETE FROM g5_chatbot_log WHERE session_id = '{$del_sid}'");
        echo json_encode(['ok' => true]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'sid missing']);
    }
    exit;
}

$session_id = isset($_GET['sid']) ? sql_real_escape_string($_GET['sid']) : '';
$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';

// ===== 설정 저장 처리 (서버사이드 권한 분리 엄격) =====
if ($page === 'settings' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // 고객사(admin02 포함)가 수정 가능한 필드
    $customer_fields = ['brand_name', 'phone', 'kakao_channel', 'quick_questions', 'admin_email', 'welcome_message', 'brand_info', 'ai_tone'];
    // 마스터(admin) 전용 필드 — admin02는 POST로 직접 쏴도 차단됨
    $master_only_fields = ['enabled', 'plan'];

    // 고객사 필드는 항상 처리
    $allowed_ai_tones = ['friendly', 'formal', 'warm', 'concise'];
    foreach ($customer_fields as $key) {
        if (isset($_POST[$key])) {
            // ai_tone은 화이트리스트 체크 (DB에 쓰레기 값 저장 방지)
            if ($key === 'ai_tone' && !in_array($_POST[$key], $allowed_ai_tones, true)) continue;
            set_cb_config($key, $_POST[$key]);
        }
    }

    // 마스터 전용 필드는 $is_super === true 일 때만 처리
    if ($is_super) {
        $prev_enabled = get_cb_config('enabled', '0');
        $prev_plan = get_cb_config('plan', '');

        // 체크박스: 체크되지 않으면 POST에 없음 → '0' 처리
        $new_enabled = (isset($_POST['enabled']) && $_POST['enabled'] === '1') ? '1' : '0';

        // 플랜: 허용값만 통과 (test30s = 테스트 전용 30초)
        $allowed_plans = ['test30s', '1', '3', '6', '12'];
        $raw_plan = isset($_POST['plan']) ? $_POST['plan'] : $prev_plan;
        $new_plan = in_array($raw_plan, $allowed_plans, true) ? $raw_plan : (in_array($prev_plan, $allowed_plans, true) ? $prev_plan : '1');

        set_cb_config('enabled', $new_enabled);
        set_cb_config('plan', $new_plan);

        // 구독 주기 재시작 조건:
        //   (1) 비활성→활성 전환  OR
        //   (2) 활성 상태에서 플랜 변경
        $should_reset_cycle = false;
        if ($new_enabled === '1') {
            if ($prev_enabled !== '1') $should_reset_cycle = true;
            elseif ($prev_plan !== $new_plan) $should_reset_cycle = true;
        }

        if ($should_reset_cycle) {
            $started_at = date('Y-m-d H:i:s');
            $expires_at = cb_calc_expiry($new_plan);
            set_cb_config('started_at', $started_at);
            set_cb_config('expires_at', $expires_at);
            set_cb_config('expiry_notified', '0');
            set_cb_config('expiry_notified_at', '');
        }
    }

    echo '<script>alert("저장되었습니다.");location.href="chatbot_admin.php?page=settings";</script>';
    exit;
}

// ===== 구독 상태 계산 =====
$current_enabled = get_cb_config('enabled', '0');
$current_plan = get_cb_config('plan', '1');
$current_started_at = get_cb_config('started_at', '');
$current_expires_at = get_cb_config('expires_at', '');
$days_left = 0;
$seconds_left = 0;
$is_expired = false;
if ($current_expires_at) {
    $expires_ts = strtotime($current_expires_at);
    if ($expires_ts !== false) {
        $diff = $expires_ts - time();
        $seconds_left = $diff;
        $days_left = (int)floor($diff / 86400);
        $is_expired = ($diff <= 0);
    }
}
$service_active = ($current_enabled === '1' && !$is_expired);

// 남은 시간 표시 — 테스트 플랜은 초, 일반 플랜은 일
if ($current_plan === 'test30s') {
    $time_left_display = $is_expired ? '만료' : max(0, $seconds_left) . '초';
} else {
    $time_left_display = $is_expired ? '만료' : $days_left . '일';
}

// 통계
$stats = sql_fetch("SELECT
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_msgs,
    (SELECT COUNT(DISTINCT session_id) FROM g5_chatbot_log WHERE created_at >= CURDATE()) as today_sessions,
    (SELECT COUNT(DISTINCT session_id) FROM g5_chatbot_log WHERE
        session_id IN (SELECT DISTINCT session_id FROM g5_chatbot_log WHERE role='user' AND message REGEXP '[0-9]{2,4}[-. ]?[0-9]{3,4}[-. ]?[0-9]{4}')
    ) as lead_count
    FROM g5_chatbot_log");
?>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI 챗봇 관리 — <?php echo $config['cf_title']; ?></title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Pretendard Variable', -apple-system, sans-serif; background: #f1f5f9; color: #1e293b; min-height: 100vh; }
a { color: #4f46e5; text-decoration: none; }
a:hover { color: #4338ca; }

.wrap { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.top-bar h1 { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.top-bar .back { color: #64748b; font-size: 13px; }
.top-bar .back:hover { color: #475569; }

.nav-tabs { display: flex; gap: 4px; margin-bottom: 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; }
.nav-tab { padding: 8px 20px; border-radius: 8px; font-size: 13px; color: #64748b; text-decoration: none; transition: all 0.15s; }
.nav-tab:hover { color: #334155; background: #f8fafc; }
.nav-tab.active { background: #eef2ff; color: #4f46e5; }

.settings-form { display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; color: #475569; font-weight: 700; }
.form-input, .form-textarea, .form-select {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 10px 14px; color: #1e293b; font-size: 13px; font-family: inherit; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.form-textarea { min-height: 80px; resize: vertical; }
.form-toggle { display: flex; align-items: center; gap: 10px; }
.toggle-switch { position: relative; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; border-radius: 24px; transition: 0.2s; }
.toggle-slider:before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
.toggle-switch input:checked + .toggle-slider { background: #22c55e; }
.toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }
.btn-save { background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-size: 13px; font-weight: 700; cursor: pointer; align-self: flex-start; transition: background 0.15s, transform 0.1s; }
.btn-save:hover { background: #4f46e5; }
.btn-save:active { transform: translateY(1px); }

/* 구독 관리 섹션 */
.sub-section {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.sub-section.master { border-color: #c7d2fe; background: linear-gradient(135deg, #fff, #f5f3ff); }
.sub-section-title { font-size: 14px; font-weight: 700; color: #4f46e5; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.sub-badge { background: #4f46e5; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px; }
.sub-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px; }
.sub-status-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
.sub-status-label { font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.sub-status-value { font-size: 16px; font-weight: 700; color: #1e293b; }
.sub-status-value.active { color: #16a34a; }
.sub-status-value.inactive { color: #94a3b8; }
.sub-status-value.warning { color: #d97706; }
.sub-status-value.danger { color: #dc2626; }
.sub-hint { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.6; }
.sub-hint.warning { color: #92400e; background: #fef3c7; border: 1px solid #fde68a; padding: 10px 12px; border-radius: 6px; margin-top: 10px; }
.sub-divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }

/* 통계 카드 */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
.stat-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.stat-label { font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 600; }
.stat-value { font-size: 28px; font-weight: 800; }
.stat-value.purple { color: #6366f1; }
.stat-value.green { color: #10b981; }
.stat-value.yellow { color: #d97706; }
.stat-value.red { color: #ef4444; }

.sessions { display: flex; flex-direction: column; gap: 6px; }
.session-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.15s;
    cursor: pointer;
}
.session-card:hover { background: #f8fafc; border-color: #c7d2fe; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.session-info { flex: 1; min-width: 0; }
.session-id { font-size: 11px; color: #94a3b8; font-family: 'SF Mono', monospace; }
.session-preview { font-size: 13px; color: #475569; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-meta { text-align: right; flex-shrink: 0; margin-left: 16px; }
.session-count { font-size: 22px; font-weight: 800; color: #6366f1; }
.session-date { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.lead-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 8px; border: 1px solid #fde68a; }

.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.btn-delete {
    background: #fff;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
}
.btn-delete:hover { background: #fef2f2; border-color: #fca5a5; }

/* 검색 / 필터 바 */
.filter-bar {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.filter-bar .f-input {
    flex: 1;
    min-width: 200px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #1e293b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
}
.filter-bar .f-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.filter-bar .f-date {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    color: #1e293b;
    outline: none;
    font-family: inherit;
}
.filter-bar .f-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #475569;
    cursor: pointer;
    user-select: none;
    padding: 0 4px;
}
.filter-bar .f-check input { accent-color: #6366f1; width: 15px; height: 15px; cursor: pointer; }
.filter-bar .f-submit {
    background: #6366f1; color: #fff; border: none; border-radius: 8px;
    padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
    transition: background 0.15s;
}
.filter-bar .f-submit:hover { background: #4f46e5; }
.filter-bar .f-reset {
    background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none;
}
.filter-bar .f-reset:hover { background: #e2e8f0; color: #334155; }
.filter-summary { font-size: 12px; color: #64748b; margin: -4px 0 12px 4px; }

.session-del {
    background: #fff;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    margin-left: 10px;
    flex-shrink: 0;
    transition: all 0.15s;
    font-family: inherit;
}
.session-del:hover { background: #dc2626; color: #fff; border-color: #dc2626; }

/* AI 성격 카드 선택 */
.tone-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
}
.tone-card {
    position: relative;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 14px;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s;
    background: #fff;
    user-select: none;
}
.tone-card:hover { border-color: #c7d2fe; background: #f8fafc; }
.tone-card input[type="radio"] {
    position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
}
.tone-card.selected {
    border-color: #6366f1;
    background: #eef2ff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.tone-label { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
.tone-desc { font-size: 11px; color: #64748b; line-height: 1.5; }
.tone-card.selected .tone-label { color: #4f46e5; }

.chat { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.chat-msg {
    max-width: 75%;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.55;
}
.chat-msg.user {
    background: #6366f1;
    color: #fff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}
.chat-msg.assistant {
    background: #fff;
    color: #1e293b;
    align-self: flex-start;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
}
.chat-time { font-size: 10px; color: #94a3b8; margin-top: 4px; }

.empty { text-align: center; padding: 80px; color: #94a3b8; font-size: 14px; }

@media (max-width: 600px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .wrap { padding: 16px; }
    .sub-status-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
</head>
<body>
<div class="wrap">

<?php if ($session_id): ?>
    <!-- 대화 상세 -->
    <div class="top-bar">
        <h1>대화 상세</h1>
        <a href="chatbot_admin.php" class="back">&larr; 목록</a>
    </div>

    <div class="detail-header">
        <span style="font-size:12px;color:#64748b;">세션: <?php echo htmlspecialchars($session_id); ?></span>
        <button class="btn-delete" onclick="delSession('<?php echo htmlspecialchars($session_id, ENT_QUOTES); ?>', true)">삭제</button>
    </div>

    <div class="chat">
    <?php
    $sql = "SELECT * FROM g5_chatbot_log WHERE session_id = '{$session_id}' ORDER BY id ASC";
    $result = sql_query($sql);
    while ($row = sql_fetch_array($result)) {
        $class = $row['role'];
        $msg = nl2br(htmlspecialchars($row['message']));
        $time = date('m/d H:i', strtotime($row['created_at']));
        echo "<div class='chat-msg {$class}'>{$msg}<div class='chat-time'>{$time}</div></div>";
    }
    ?>
    </div>

    <script>
    function delSession(sid, goBack) {
        if (!confirm('이 상담 내역을 삭제할까요?\n복구할 수 없어요.')) return;
        var f = new FormData(); f.append('sid', sid);
        fetch('chatbot_admin.php?action=delete_session', { method:'POST', body: f })
            .then(function(r){ return r.json(); })
            .then(function(d){
                if (d && d.ok) { location.href = goBack ? 'chatbot_admin.php' : location.href; }
                else { alert('삭제 실패: ' + ((d && d.error) || 'unknown')); }
            })
            .catch(function(){ alert('네트워크 오류'); });
    }
    </script>

<?php elseif ($page === 'settings'): ?>
    <!-- 설정 페이지 -->
    <div class="top-bar">
        <h1>AI 챗봇 관리</h1>
        <a href="<?php echo G5_ADMIN_URL; ?>" class="back">&larr; 관리자 홈</a>
    </div>
    <div class="nav-tabs">
        <a href="chatbot_admin.php" class="nav-tab">상담 내역</a>
        <a href="chatbot_admin.php?page=settings" class="nav-tab active">설정</a>
    </div>

    <form method="post" class="settings-form">

        <?php if ($is_super): ?>
            <!-- ======================== 마스터(admin) 전용 ======================== -->
            <div class="sub-section master">
                <div class="sub-section-title">
                    <span class="sub-badge">MASTER</span>
                    구독 관리 (마스터 전용)
                </div>

                <div class="sub-status-grid">
                    <div class="sub-status-item">
                        <div class="sub-status-label">서비스 상태</div>
                        <div class="sub-status-value <?php echo $service_active ? 'active' : 'inactive'; ?>">
                            <?php
                            if ($service_active) echo '● 사용중';
                            elseif ($current_enabled === '1' && $is_expired) echo '● 만료됨';
                            else echo '○ 사용안함';
                            ?>
                        </div>
                    </div>
                    <?php if ($current_enabled === '1' && $current_expires_at): ?>
                    <div class="sub-status-item">
                        <div class="sub-status-label">플랜</div>
                        <div class="sub-status-value" style="font-size:<?php echo $current_plan === 'test30s' ? '13px' : '16px'; ?>;"><?php echo cb_plan_label($current_plan); ?></div>
                    </div>
                    <div class="sub-status-item">
                        <div class="sub-status-label">시작일시</div>
                        <div class="sub-status-value" style="font-size:12px;"><?php echo $current_started_at ? date('Y.m.d H:i:s', strtotime($current_started_at)) : '-'; ?></div>
                    </div>
                    <div class="sub-status-item">
                        <div class="sub-status-label">만료일시</div>
                        <div class="sub-status-value" style="font-size:12px;"><?php echo date('Y.m.d H:i:s', strtotime($current_expires_at)); ?></div>
                    </div>
                    <div class="sub-status-item">
                        <div class="sub-status-label">남은 시간</div>
                        <div class="sub-status-value <?php
                            if ($is_expired) echo 'danger';
                            elseif ($current_plan === 'test30s') echo 'warning';
                            elseif ($days_left <= 15) echo 'warning';
                            else echo 'active';
                        ?>" id="timeLeft" data-expires="<?php echo strtotime($current_expires_at); ?>">
                            <?php echo $time_left_display; ?>
                        </div>
                    </div>
                    <div class="sub-status-item">
                        <div class="sub-status-label">만료 알림</div>
                        <div class="sub-status-value" style="font-size:12px;">
                            <?php echo get_cb_config('expiry_notified', '0') === '1' ? ('발송됨 ' . get_cb_config('expiry_notified_at', '')) : '미발송'; ?>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>

                <hr class="sub-divider">

                <div class="form-group">
                    <label class="form-label">사용 여부</label>
                    <div class="form-toggle">
                        <label class="toggle-switch">
                            <input type="checkbox" name="enabled" value="1" id="enabledToggle" <?php echo $current_enabled === '1' ? 'checked' : ''; ?>>
                            <span class="toggle-slider"></span>
                        </label>
                        <span id="enabledLabel" style="font-size:13px;font-weight:600;color:<?php echo $current_enabled==='1'?'#16a34a':'#94a3b8'; ?>;">
                            <?php echo $current_enabled === '1' ? '사용함' : '사용안함'; ?>
                        </span>
                    </div>
                </div>

                <div class="form-group" id="planGroup" style="<?php echo $current_enabled === '1' ? '' : 'display:none;'; ?>margin-top:12px;">
                    <label class="form-label">사용 기간</label>
                    <select name="plan" class="form-select">
                        <option value="test30s" <?php echo $current_plan === 'test30s' ? 'selected' : ''; ?>>⚡ 테스트 30초 (개발 전용)</option>
                        <option value="1"  <?php echo $current_plan === '1'  ? 'selected' : ''; ?>>1개월</option>
                        <option value="3"  <?php echo $current_plan === '3'  ? 'selected' : ''; ?>>3개월</option>
                        <option value="6"  <?php echo $current_plan === '6'  ? 'selected' : ''; ?>>6개월</option>
                        <option value="12" <?php echo $current_plan === '12' ? 'selected' : ''; ?>>12개월</option>
                    </select>
                    <p class="sub-hint">
                        · 비활성 → 활성 전환 시, 또는 활성 상태에서 기간 변경 시 만료시각이 저장 시점 기준으로 재계산됩니다.<br>
                        · 활성 → 비활성 전환은 만료시각을 유지합니다 (일시중단).<br>
                        · <strong style="color:#d97706;">만료 15일 전 vworks02@naver.com으로 자동 알림이 1회 발송</strong>됩니다. 이 메일은 고객사가 설정한 '알림 이메일'과 무관한 내부 직원용입니다. 주기 갱신 시 재발송 가능.<br>
                        · <strong style="color:#dc2626;">⚡ 테스트 30초</strong>: 저장 즉시 알림 메일이 vworks02@naver.com으로 발송되고, 30초 후 자동으로 만료 처리되어 위젯이 내려갑니다. 실서비스에서는 선택 금지.
                    </p>
                </div>
            </div>
            <!-- ======================== /마스터 전용 ======================== -->
        <?php else: ?>
            <!-- ======================== 고객사(admin02 등) 읽기전용 ======================== -->
            <div class="sub-section">
                <div class="sub-section-title">📡 서비스 구독 상태</div>
                <?php if ($service_active): ?>
                    <div class="sub-status-grid">
                        <div class="sub-status-item">
                            <div class="sub-status-label">상태</div>
                            <div class="sub-status-value active">● 사용중</div>
                        </div>
                        <div class="sub-status-item">
                            <div class="sub-status-label">플랜</div>
                            <div class="sub-status-value" style="font-size:<?php echo $current_plan === 'test30s' ? '13px' : '16px'; ?>;"><?php echo cb_plan_label($current_plan); ?></div>
                        </div>
                        <div class="sub-status-item">
                            <div class="sub-status-label">만료일시</div>
                            <div class="sub-status-value" style="font-size:12px;"><?php echo date('Y.m.d H:i', strtotime($current_expires_at)); ?></div>
                        </div>
                        <div class="sub-status-item">
                            <div class="sub-status-label">남은 시간</div>
                            <div class="sub-status-value <?php
                                if ($current_plan === 'test30s') echo 'warning';
                                elseif ($days_left <= 15) echo 'warning';
                                else echo 'active';
                            ?>">
                                <?php echo $time_left_display; ?>
                            </div>
                        </div>
                    </div>
                    <?php if ($current_plan !== 'test30s' && $days_left <= 15): ?>
                    <p class="sub-hint warning">⚠ 만료가 얼마 남지 않았습니다. 연장을 원하시면 관리자에게 문의해주세요.</p>
                    <?php endif; ?>
                <?php elseif ($is_expired): ?>
                    <p class="sub-hint warning">⚠ AI 챗봇 서비스가 만료되었습니다. 연장을 원하시면 관리자에게 문의해주세요.</p>
                <?php else: ?>
                    <p class="sub-hint">현재 AI 챗봇 서비스가 비활성화되어 있습니다. 관리자에게 문의해주세요.</p>
                <?php endif; ?>
            </div>
            <!-- ======================== /고객사 ======================== -->
        <?php endif; ?>

        <?php
        $current_tone = get_cb_config('ai_tone', 'friendly');
        $tone_options = [
            'friendly' => ['label' => '밝고 친근', 'desc' => '발랄하되 오버하지 않는 구어체. 친근한 리액션.'],
            'formal'   => ['label' => '차분하고 신뢰감', 'desc' => '격식 있는 전문가 톤. 감정 표현 절제.'],
            'warm'     => ['label' => '따뜻하고 공감형', 'desc' => '부드러운 말투. 공감 우선, 상냥한 리액션.'],
            'concise'  => ['label' => '간결하고 사실적', 'desc' => '군더더기 없이 팩트만. 짧고 빠르게.'],
        ];
        if (!isset($tone_options[$current_tone])) $current_tone = 'friendly';
        ?>
        <div class="form-group">
            <label class="form-label">AI 성격 (챗봇 말투)</label>
            <div class="tone-grid">
                <?php foreach ($tone_options as $value => $opt): ?>
                <label class="tone-card<?php echo $current_tone === $value ? ' selected' : ''; ?>" data-tone="<?php echo $value; ?>">
                    <input type="radio" name="ai_tone" value="<?php echo $value; ?>" <?php echo $current_tone === $value ? 'checked' : ''; ?>>
                    <div class="tone-label"><?php echo $opt['label']; ?></div>
                    <div class="tone-desc"><?php echo $opt['desc']; ?></div>
                </label>
                <?php endforeach; ?>
            </div>
            <p style="font-size:11px;color:#64748b;margin-top:6px;">선택 후 저장하면 다음 대화부터 바로 반영됩니다.</p>
        </div>

        <div class="form-group">
            <label class="form-label">브랜드명</label>
            <input type="text" name="brand_name" class="form-input" value="<?php echo htmlspecialchars(get_cb_config('brand_name', '러키비키')); ?>">
        </div>
        <div class="form-group">
            <label class="form-label">전화번호</label>
            <input type="text" name="phone" class="form-input" value="<?php echo htmlspecialchars(get_cb_config('phone', '032-555-8882')); ?>">
        </div>
        <div class="form-group">
            <label class="form-label">카카오톡 채널 URL</label>
            <input type="text" name="kakao_channel" class="form-input" value="<?php echo htmlspecialchars(get_cb_config('kakao_channel', '')); ?>" placeholder="https://pf.kakao.com/...">
        </div>
        <div class="form-group">
            <label class="form-label">알림 이메일 (챗봇 리드 수신처)</label>
            <input type="email" name="admin_email" class="form-input" value="<?php echo htmlspecialchars(get_cb_config('admin_email', '')); ?>">
        </div>
        <div class="form-group">
            <label class="form-label">빠른 질문 (쉼표로 구분)</label>
            <input type="text" name="quick_questions" class="form-input" value="<?php echo htmlspecialchars(get_cb_config('quick_questions', '')); ?>">
        </div>
        <div class="form-group">
            <label class="form-label">환영 메시지</label>
            <textarea name="welcome_message" class="form-textarea"><?php echo htmlspecialchars(get_cb_config('welcome_message', '')); ?></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">브랜드 정보 (AI가 이 내용을 기반으로 답변합니다)</label>
            <p style="font-size:11px;color:#64748b;margin-bottom:6px;">창업 비용, 메뉴 구성, 창업 절차, 매장 규모, 교육 내용 등을 자세히 적을수록 AI 답변 품질이 올라갑니다.</p>
            <textarea name="brand_info" class="form-textarea" style="min-height:200px;" maxlength="500" oninput="document.getElementById('charCount').textContent=this.value.length+'/500'"><?php echo htmlspecialchars(get_cb_config('brand_info', '')); ?></textarea>
            <span id="charCount" style="font-size:11px;color:#64748b;">0/500</span>
        </div>
        <button type="submit" class="btn-save">저장</button>
    </form>

    <script>
    // AI 성격 카드 선택 토글 (admin/admin02 공통)
    (function(){
        document.querySelectorAll('.tone-card').forEach(function(card){
            card.addEventListener('click', function(){
                document.querySelectorAll('.tone-card').forEach(function(c){ c.classList.remove('selected'); });
                card.classList.add('selected');
                var r = card.querySelector('input[type="radio"]');
                if (r) r.checked = true;
            });
        });
    })();
    </script>

    <?php if ($is_super): ?>
    <script>
    (function(){
        var tog = document.getElementById('enabledToggle');
        var lbl = document.getElementById('enabledLabel');
        var grp = document.getElementById('planGroup');
        if (tog) {
            tog.addEventListener('change', function(){
                grp.style.display = this.checked ? '' : 'none';
                lbl.textContent = this.checked ? '사용함' : '사용안함';
                lbl.style.color = this.checked ? '#16a34a' : '#94a3b8';
            });
        }

        // 테스트 30초 플랜 카운트다운: 만료되면 자동 새로고침 (위젯 내려감 확인용)
        var timeEl = document.getElementById('timeLeft');
        var currentPlan = <?php echo json_encode($current_plan); ?>;
        if (timeEl && currentPlan === 'test30s') {
            var expiresTs = parseInt(timeEl.getAttribute('data-expires'), 10) * 1000;
            var refreshed = false;
            var tick = function(){
                var remaining = Math.floor((expiresTs - Date.now()) / 1000);
                if (remaining <= 0) {
                    timeEl.textContent = '만료';
                    timeEl.style.color = '#dc2626';
                    if (!refreshed) {
                        refreshed = true;
                        // 만료 직후 2초 뒤 새로고침 → 위젯/상태 실제 내려갔는지 확인
                        setTimeout(function(){ location.reload(); }, 2000);
                    }
                    return;
                }
                timeEl.textContent = remaining + '초';
            };
            tick();
            setInterval(tick, 1000);
        }
    })();
    </script>
    <?php endif; ?>

<?php else: ?>
    <!-- 대시보드 -->
    <div class="top-bar">
        <h1>AI 챗봇 관리</h1>
        <a href="<?php echo G5_ADMIN_URL; ?>" class="back">&larr; 관리자 홈</a>
    </div>
    <div class="nav-tabs">
        <a href="chatbot_admin.php" class="nav-tab active">상담 내역</a>
        <a href="chatbot_admin.php?page=settings" class="nav-tab<?php echo $page==='settings'?' active':''; ?>">설정</a>
    </div>

    <?php if (!$service_active): ?>
    <div class="sub-section" style="border-color:<?php echo $is_expired ? '#fecaca' : '#fde68a'; ?>;background:<?php echo $is_expired ? '#fef2f2' : '#fffbeb'; ?>;">
        <div class="sub-section-title" style="color:<?php echo $is_expired ? '#dc2626' : '#d97706'; ?>;">
            <?php
            if ($is_expired) echo '⚠ 서비스 만료';
            else echo '⏸ 서비스 비활성';
            ?>
        </div>
        <p style="font-size:13px;color:#475569;line-height:1.6;">
            <?php if ($is_expired): ?>
                AI 챗봇 서비스가 만료되어 홈페이지에서 위젯이 표시되지 않습니다.
                <?php if ($is_super): ?>설정 페이지에서 플랜을 재설정하세요.<?php else: ?>관리자에게 연장을 문의해주세요.<?php endif; ?>
            <?php else: ?>
                AI 챗봇이 비활성 상태입니다. 홈페이지에서 위젯이 표시되지 않습니다.
                <?php if ($is_super): ?>설정 페이지에서 사용함으로 전환하세요.<?php endif; ?>
            <?php endif; ?>
        </p>
    </div>
    <?php endif; ?>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-label">전체 상담</div>
            <div class="stat-value purple"><?php echo $stats['total_sessions']; ?></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">오늘 상담</div>
            <div class="stat-value green"><?php echo $stats['today_sessions']; ?></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">연락처 남김</div>
            <div class="stat-value yellow"><?php echo $stats['lead_count']; ?></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">총 메시지</div>
            <div class="stat-value red"><?php echo $stats['total_msgs']; ?></div>
        </div>
    </div>

    <?php
    // ===== 검색 / 필터 =====
    $q_keyword = isset($_GET['q']) ? trim($_GET['q']) : '';
    $q_from    = isset($_GET['from']) ? trim($_GET['from']) : '';
    $q_to      = isset($_GET['to']) ? trim($_GET['to']) : '';
    $q_contact = !empty($_GET['contact']);

    // 입력값을 SQL용으로 안전 처리
    $f_keyword = sql_real_escape_string($q_keyword);
    // 날짜 포맷 YYYY-MM-DD 만 허용
    $valid_date = function($d) { return (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $d); };
    $f_from = $valid_date($q_from) ? $q_from : '';
    $f_to   = $valid_date($q_to) ? $q_to : '';
    ?>

    <form method="get" class="filter-bar">
        <input type="text" name="q" class="f-input" placeholder="키워드 검색 (메시지 내용)" value="<?php echo htmlspecialchars($q_keyword); ?>">
        <input type="date" name="from" class="f-date" value="<?php echo htmlspecialchars($f_from); ?>" title="시작일">
        <span style="color:#94a3b8;">~</span>
        <input type="date" name="to" class="f-date" value="<?php echo htmlspecialchars($f_to); ?>" title="종료일">
        <label class="f-check">
            <input type="checkbox" name="contact" value="1" <?php echo $q_contact ? 'checked' : ''; ?>>
            연락처 남긴 상담만
        </label>
        <button type="submit" class="f-submit">검색</button>
        <?php if ($q_keyword || $f_from || $f_to || $q_contact): ?>
            <a href="chatbot_admin.php" class="f-reset">초기화</a>
        <?php endif; ?>
    </form>

    <?php
    // === 세션 리스트 쿼리 조립 ===
    $where = [];

    // 키워드 검색: user/assistant 메시지 모두에서 LIKE
    if ($f_keyword !== '') {
        $kw = $f_keyword;
        $where[] = "session_id IN (SELECT DISTINCT session_id FROM g5_chatbot_log WHERE message LIKE '%{$kw}%')";
    }

    // 날짜 범위
    if ($f_from !== '') $where[] = "DATE(created_at) >= '{$f_from}'";
    if ($f_to !== '')   $where[] = "DATE(created_at) <= '{$f_to}'";

    // 연락처 남김만
    if ($q_contact) {
        $where[] = "session_id IN (SELECT DISTINCT session_id FROM g5_chatbot_log WHERE role='user' AND message REGEXP '[0-9]{2,4}[-. ]?[0-9]{3,4}[-. ]?[0-9]{4}')";
    }

    $where_sql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $sql = "SELECT session_id,
                   MIN(created_at) as first_msg,
                   MAX(created_at) as last_msg,
                   COUNT(*) as msg_count,
                   MIN(ip) as ip,
                   GROUP_CONCAT(CASE WHEN role='user' THEN message END SEPARATOR ' ') as user_msgs
            FROM g5_chatbot_log
            {$where_sql}
            GROUP BY session_id
            ORDER BY MAX(created_at) DESC
            LIMIT 200";
    $result = sql_query($sql);

    // 결과 개수 미리 계산 (요약 표시용) — 단순 실행 후 num_rows
    $result_count = 0;
    $rows_buffer = [];
    while ($row = sql_fetch_array($result)) {
        $rows_buffer[] = $row;
        $result_count++;
    }
    ?>

    <?php if ($q_keyword || $f_from || $f_to || $q_contact): ?>
        <div class="filter-summary">🔍 <?php echo $result_count; ?>건의 상담이 검색됐어요.</div>
    <?php endif; ?>

    <div class="sessions">
    <?php
    $has_rows = false;
    foreach ($rows_buffer as $row) {
        $has_rows = true;
        $sid = $row['session_id'];
        $encoded_sid = urlencode($sid);
        $count = $row['msg_count'];
        $first = date('m/d H:i', strtotime($row['first_msg']));
        $ip = $row['ip'];
        $preview = mb_substr(strip_tags($row['user_msgs'] ?? ''), 0, 70, 'UTF-8');
        $is_lead = preg_match('/\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/', $row['user_msgs'] ?? '');
        $lead_html = $is_lead ? '<span class="lead-badge">📞 연락처</span>' : '';
        $js_sid = htmlspecialchars($sid, ENT_QUOTES);

        echo "<a href='chatbot_admin.php?sid={$encoded_sid}' class='session-card'>";
        echo "<div class='session-info'>";
        echo "<div class='session-id'>{$sid}{$lead_html}</div>";
        echo "<div class='session-preview'>{$preview}...</div>";
        echo "</div>";
        echo "<div class='session-meta'>";
        echo "<div class='session-count'>{$count}</div>";
        echo "<div class='session-date'>{$first}</div>";
        echo "</div>";
        echo "<button type='button' class='session-del' title='상담 삭제' onclick=\"event.preventDefault();event.stopPropagation();delSession('{$js_sid}',false);\">삭제</button>";
        echo "</a>";
    }
    if (!$has_rows) {
        if ($q_keyword || $f_from || $f_to || $q_contact) {
            echo "<div class='empty'>검색 조건에 맞는 상담이 없어요.</div>";
        } else {
            echo "<div class='empty'>아직 상담 내역이 없습니다.</div>";
        }
    }
    ?>
    </div>
    <script>
    function delSession(sid, goBack) {
        if (!confirm('이 상담 내역을 삭제할까요?\n복구할 수 없어요.')) return;
        var f = new FormData(); f.append('sid', sid);
        fetch('chatbot_admin.php?action=delete_session', { method:'POST', body: f })
            .then(function(r){ return r.json(); })
            .then(function(d){
                if (d && d.ok) { location.reload(); }
                else { alert('삭제 실패: ' + ((d && d.error) || 'unknown')); }
            })
            .catch(function(){ alert('네트워크 오류'); });
    }
    </script>
<?php endif; ?>

</div>
</body>
</html>
