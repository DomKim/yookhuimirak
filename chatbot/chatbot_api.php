<?php
define('_GNUBOARD_', true);
define('G5_SET_DB', true);

$g5_path = array('path' => realpath(dirname(__FILE__).'/..'));
include_once($g5_path['path'].'/common.php');
include_once(dirname(__FILE__).'/chatbot_config.php');

header('Content-Type: application/json; charset=utf-8');

$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true) ?: [];
$action = $_GET['action'] ?? ($input['action'] ?? 'chat');

// ===== 구독 상태 체크 (모든 액션 공통) =====
sql_query("CREATE TABLE IF NOT EXISTS g5_chatbot_config (
    config_key VARCHAR(64) PRIMARY KEY,
    config_value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4", false);

function _cb_get($key, $default = '') {
    $k = sql_real_escape_string($key);
    $row = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='{$k}'");
    return isset($row['config_value']) ? $row['config_value'] : $default;
}

function _cb_set($key, $val) {
    $k = sql_real_escape_string($key);
    $v = sql_real_escape_string($val);
    sql_query("INSERT INTO g5_chatbot_config (config_key, config_value) VALUES ('{$k}', '{$v}') ON DUPLICATE KEY UPDATE config_value='{$v}'");
}

$_cb_enabled_flag = _cb_get('enabled', '0');
$_cb_expires_at = _cb_get('expires_at', '');
$_cb_not_expired = (!$_cb_expires_at || strtotime($_cb_expires_at) > time());
$_cb_service_active = ($_cb_enabled_flag === '1' && $_cb_not_expired);

// === 만료 15일전 알림 (admin 페이지 외 경로에서도 발송 보장) ===
function _cb_check_expiry_alert() {
    $enabled = _cb_get('enabled', '0');
    if ($enabled !== '1') return;
    $expires_at = _cb_get('expires_at', '');
    if (!$expires_at) return;
    if (_cb_get('expiry_notified', '0') === '1') return;
    $ts = strtotime($expires_at);
    if ($ts === false) return;
    $sec = $ts - time();
    if ($sec <= 0) return;
    $plan = _cb_get('plan', '');
    if ($plan !== 'test30s') {
        $days = (int)floor($sec / 86400);
        if ($days > 15) return;
    }
    $days_left = (int)floor($sec / 86400);

    $brand = _cb_get('brand_name', '러키비키');
    $started = _cb_get('started_at', '');

    $to = 'vworks02@naver.com';
    $subj = "[{$brand}] AI 챗봇 서비스 만료 예정 — D-{$days_left}";
    $body  = "<h3 style='color:#f59e0b;'>AI 챗봇 서비스 만료 알림</h3>";
    $body .= "<table cellpadding='8' style='border-collapse:collapse;font-size:14px;'>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>고객사</td><td>" . htmlspecialchars($brand) . "</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>플랜</td><td>{$plan}" . ($plan === 'test30s' ? '' : '개월') . "</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>시작</td><td>{$started}</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>만료</td><td style='color:#dc2626;font-weight:700;'>{$expires_at}</td></tr>";
    $body .= "<tr><td style='background:#f3f4f6;font-weight:700;'>남은 일수</td><td style='color:#dc2626;font-weight:700;'>{$days_left}일</td></tr>";
    $body .= "</table>";

    $sent = false;
    $mp = realpath(dirname(__FILE__).'/../plugin/PHPMailer/PHPMailerAutoload.php');
    if (file_exists($mp)) {
        require_once($mp);
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
            $mail->setFrom('guswhd7894@naver.com', $brand . ' 시스템');
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subj;
            $mail->Body = $body;
            $sent = @$mail->send();
        } catch (Exception $e) { $sent = false; }
    }
    if (!$sent && function_exists('mail')) {
        $h  = "MIME-Version: 1.0\r\n";
        $h .= "Content-Type: text/html; charset=UTF-8\r\n";
        $h .= "From: {$brand} 시스템 <guswhd7894@naver.com>\r\n";
        $sent = @mail($to, $subj, $body, $h);
    }
    if ($sent) {
        _cb_set('expiry_notified', '1');
        _cb_set('expiry_notified_at', date('Y-m-d H:i:s'));
    }
}
_cb_check_expiry_alert();

// 만료 감지 시 enabled 플래그 자동 '0' 전환 (토글/상태 일관성)
if (_cb_get('enabled', '0') === '1' && $_cb_expires_at) {
    $_exp_ts = strtotime($_cb_expires_at);
    if ($_exp_ts !== false && $_exp_ts <= time()) {
        _cb_set('enabled', '0');
        $_cb_enabled_flag = '0';
        $_cb_service_active = false;
    }
}

// config 조회는 GET 허용 (위젯 초기화 시 브랜드/폰 동기화)
if ($action === 'config') {
    sql_query("CREATE TABLE IF NOT EXISTS g5_chatbot_config (
        config_key VARCHAR(64) PRIMARY KEY,
        config_value TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4", false);
    sql_query("SET NAMES utf8mb4");

    $db_brand = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='brand_name'");
    $db_phone = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='phone'");
    $db_welcome = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='welcome_message'");
    $db_quick = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='quick_questions'");

    $quick_list = !empty($db_quick['config_value'])
        ? array_map('trim', explode(',', $db_quick['config_value']))
        : $chatbot_config['quick_questions'];

    echo json_encode([
        'brand_name' => !empty($db_brand['config_value']) ? $db_brand['config_value'] : $chatbot_config['brand_name'],
        'phone'      => !empty($db_phone['config_value']) ? $db_phone['config_value'] : $chatbot_config['phone'],
        'welcome'    => !empty($db_welcome['config_value']) ? $db_welcome['config_value'] : '',
        'quick_questions' => $quick_list,
        'service_active' => $_cb_service_active,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'POST only']);
    exit;
}

// 비활성/만료 시 chat 차단 (footer 가드 우회 방지)
if (!$_cb_service_active) {
    echo json_encode(['error' => 'service disabled or expired'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 테이블 자동 생성
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

// 일반 채팅
$message = trim($input['message'] ?? '');
$session_id = !empty($input['session_id']) ? $input['session_id'] : bin2hex(random_bytes(16));
$history = $input['history'] ?? [];

if (!$message) {
    echo json_encode(['error' => 'empty message']);
    exit;
}

$hour = (int)date('H');
$is_business = ($hour >= 9 && $hour < 18);

$messages = [];
$history = array_slice($history, -10);
foreach ($history as $h) {
    $messages[] = ['role' => $h['role'], 'content' => $h['content']];
}
$messages[] = ['role' => 'user', 'content' => $message];

// DB에서 관리자 설정 로드 → 시스템 프롬프트에 주입
$db_brand_info = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='brand_info'");
$db_brand_name = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='brand_name'");
$db_phone = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='phone'");
$db_welcome = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='welcome_message'");

$system = $chatbot_config['system_prompt'];

// ===== AI 성격(톤) 프리셋 주입 (admin02가 관리자페이지에서 선택) =====
$tone_presets = [
    'friendly' => "# 톤 — 밝고 친근하게\n- 경쾌한 구어체, 딱딱한 문어체 금지.\n- 리액션 자연스럽게: \"아, 궁금하셨구나~\", \"오 좋은 질문이에요\".\n- 이모지는 🙂 정도로 한 답변에 1개 이하.\n- 과장·홍보성 단어 금지(\"최고!!\", \"무조건!\" 등).\n- 정보는 담백, 리액션만 따뜻하게.",
    'formal'   => "# 톤 — 차분하고 신뢰감 있게\n- 격식 있고 절제된 존대말.\n- 전문성 강조, 감정 표현은 담백하게.\n- 이모지·느낌표 남발 금지.\n- 군더더기 없이 정확한 사실 전달.",
    'warm'     => "# 톤 — 따뜻하고 공감형으로\n- 부드럽고 상냥한 말투.\n- 감정 공감 우선: \"걱정 많으셨겠어요\", \"도움드릴 수 있어 다행이에요\" 같이.\n- 이모지 🙂 드물게.\n- 성급한 결론 지양, 충분히 들어드리는 느낌.",
    'concise'  => "# 톤 — 간결하고 사실적으로\n- 감정 표현 최소화. 팩트 중심.\n- 인사·리액션 최소. 바로 핵심으로.\n- 이모지 X, 느낌표 X.\n- 문장 짧게(2~3문장).",
];
$db_tone = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='ai_tone'");
$ai_tone = (isset($db_tone['config_value']) && isset($tone_presets[$db_tone['config_value']])) ? $db_tone['config_value'] : 'friendly';
// 최우선 톤 지시로서 system 맨 앞에 삽입
$system = $tone_presets[$ai_tone] . "\n\n" . $system;

if (!empty($db_brand_info['config_value'])) {
    $system .= "\n\n## 브랜드 상세 정보 (관리자가 입력한 최신 정보)\n" . $db_brand_info['config_value'];
}
$effective_brand = !empty($db_brand_name['config_value']) ? $db_brand_name['config_value'] : $chatbot_config['brand_name'];
$effective_phone = !empty($db_phone['config_value']) ? $db_phone['config_value'] : $chatbot_config['phone'];

// system_prompt 내 기본 브랜드/전화번호를 DB값으로 치환
$system = str_replace($chatbot_config['brand_name'], $effective_brand, $system);
$system = str_replace($chatbot_config['phone'], $effective_phone, $system);

if ($is_business) {
    $system .= "\n\n[현재 업무시간입니다. 고객이 원하면 '지금 바로 상담사 연결도 가능해요! {$effective_phone}로 전화 주세요.'라고 안내하세요.]";
} else {
    $system .= "\n\n[현재 업무시간 외입니다. '업무시간(09~18시)에 {$effective_phone}로 전화 주시면 상담사가 바로 연결돼요. 지금은 제가 도와드릴게요!'라고 안내하세요.]";
}

$reply = call_claude_messages($chatbot_config, $system, $messages);

if (!$reply) {
    echo json_encode(['error' => 'empty reply']);
    exit;
}

// 응답 후처리: 브랜드명/전화번호 강제 정정 (AI 환각 2차 방어막)
$reply = preg_replace('/루키비키|럭키비키|락키비키|러키바이키|러키비이키/u', '러키비키', $reply);
$reply = preg_replace('/\bLuckyViky\b|\bLuckyBiky\b|\bLuckyVicky\b/i', 'LUKYVIKY', $reply);
// 다른 브랜드 전화번호 유출 방지 (1688-1609는 마라인더컵 번호)
$reply = preg_replace('/1688-1609|1688-0865/', $effective_phone, $reply);

// DB 저장
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$safe_session = sql_real_escape_string($session_id);
$safe_message = sql_real_escape_string($message);
$safe_reply = sql_real_escape_string($reply);
$safe_ip = sql_real_escape_string($ip);

sql_query("INSERT INTO g5_chatbot_log (session_id, role, message, ip) VALUES ('{$safe_session}', 'user', '{$safe_message}', '{$safe_ip}')");
sql_query("INSERT INTO g5_chatbot_log (session_id, role, message, ip) VALUES ('{$safe_session}', 'assistant', '{$safe_reply}', '{$safe_ip}')");

// 연락처 감지 → 이메일 알림
if (preg_match('/\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/', $message, $phone_match)) {
    $phone = $phone_match[0];
    $all_user_msgs = '';
    $log = sql_query("SELECT message FROM g5_chatbot_log WHERE session_id='{$safe_session}' AND role='user' ORDER BY id ASC");
    while ($r = sql_fetch_array($log)) {
        $all_user_msgs .= $r['message'] . "\n";
    }
    send_lead_alert($chatbot_config, $phone, $all_user_msgs, $ip);
}

echo json_encode([
    'reply' => $reply,
    'session_id' => $session_id,
    'is_business' => $is_business,
]);

// ====== 함수 ======

function call_claude_messages($config, $system, $messages) {
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . $config['api_key'],
            'anthropic-version: 2023-06-01',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => $config['model'],
            'max_tokens' => 500,
            // 프롬프트 캐싱: system_prompt를 5분간 캐시 → 동일 prompt 재사용 시 input 비용 90% 할인
            'system' => [
                ['type' => 'text', 'text' => $system, 'cache_control' => ['type' => 'ephemeral']]
            ],
            'messages' => $messages,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200) return '';
    $data = json_decode($response, true);
    return $data['content'][0]['text'] ?? '';
}


function send_lead_alert($config, $phone, $user_msgs, $ip) {
    // 관리자가 설정한 알림 이메일 우선 사용
    $db_email = sql_fetch("SELECT config_value FROM g5_chatbot_config WHERE config_key='admin_email'");
    $to = !empty($db_email['config_value']) ? $db_email['config_value'] : 'jinheung7989@naver.com';
    $subject = "[{$config['brand_name']}] 챗봇 리드 — {$phone}";
    $body = "<h3>챗봇에서 연락처가 감지되었습니다</h3>";
    $body .= "<p><strong>연락처:</strong> {$phone}</p>";
    $body .= "<p><strong>IP:</strong> {$ip}</p>";
    $body .= "<p><strong>대화 내용:</strong></p>";
    $body .= "<pre>" . htmlspecialchars($user_msgs) . "</pre>";

    // 이메일 발송
    $mail_path = realpath(dirname(__FILE__).'/../plugin/PHPMailer/PHPMailerAutoload.php');
    if (file_exists($mail_path)) {
        require_once($mail_path);
        $mail = new PHPMailer();
        $mail->isSMTP();
        $mail->Host = 'smtp.naver.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'guswhd7894';
        $mail->Password = 'D7ET4KR9F29S';
        $mail->SMTPSecure = 'ssl';
        $mail->Port = 465;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom('guswhd7894@naver.com', $config['brand_name'] . ' 챗봇');
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        @$mail->send();
    }

}
