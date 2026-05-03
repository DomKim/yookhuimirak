#!/bin/bash
# ============================================
# vwebmaster 프로젝트 초기 세팅
# 클론 후 한번만 실행하면 독립된 환경 완성
# ============================================

set -e

# 프로젝트명 = 현재 폴더명 (또는 인자로 전달)
PROJECT_NAME=${1:-$(basename "$(pwd)")}
DB_NAME=$(echo "$PROJECT_NAME" | sed 's/[^a-zA-Z0-9_]/_/g')
PORT=${2:-8080}

echo ""
echo "🚀 vwebmaster 프로젝트 세팅"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  프로젝트명: $PROJECT_NAME"
echo "  DB명:       $DB_NAME"
echo "  포트:       $PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 템플릿 origin 제거 (새 프로젝트니까)
if git remote get-url origin 2>/dev/null | grep -q "vwebmaster"; then
    echo "🔗 템플릿 origin 제거..."
    git remote remove origin
    echo "✅ origin 제거 완료 — 새 레포 연결: git remote add origin [새레포URL]"
fi
echo ""

# 2. MySQL 접속 확인
echo "📡 MySQL 연결 확인..."
if ! mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo "❌ MySQL 접속 실패. MySQL이 실행 중인지 확인하세요."
    echo "   비밀번호가 필요하면: MYSQL_PWD=비밀번호 bash setup.sh"
    exit 1
fi
echo "✅ MySQL 연결 OK"

# 3. DB 생성 + 데이터 임포트
echo ""
echo "📦 데이터베이스 생성: $DB_NAME"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

if [ -f "sql/vweb_base.sql" ]; then
    echo "📥 기본 데이터 임포트..."
    mysql -u root "$DB_NAME" < sql/vweb_base.sql
    echo "✅ 데이터 임포트 완료"
else
    echo "⚠️  sql/vweb_base.sql 없음 — /install/ 페이지에서 직접 설치하세요"
fi

# 3. dbconfig.php 생성
echo ""
echo "⚙️  DB 설정 파일 생성..."
cat > data/dbconfig.php << DBEOF
<?php
if (!defined('_GNUBOARD_')) exit;
define('G5_MYSQL_HOST', 'localhost');
define('G5_MYSQL_USER', 'root');
define('G5_MYSQL_PASSWORD', '');
define('G5_MYSQL_DB', '$DB_NAME');
define('G5_MYSQL_SET_MODE', true);

define('G5_TABLE_PREFIX', 'g5_');
define('G5_TOKEN_ENCRYPTION_KEY', '$(openssl rand -hex 16)');

\$g5['write_prefix'] = G5_TABLE_PREFIX.'write_';
\$g5['auth_table'] = G5_TABLE_PREFIX.'auth';
\$g5['config_table'] = G5_TABLE_PREFIX.'config';
\$g5['group_table'] = G5_TABLE_PREFIX.'group';
\$g5['group_member_table'] = G5_TABLE_PREFIX.'group_member';
\$g5['board_table'] = G5_TABLE_PREFIX.'board';
\$g5['board_file_table'] = G5_TABLE_PREFIX.'board_file';
\$g5['board_good_table'] = G5_TABLE_PREFIX.'board_good';
\$g5['board_new_table'] = G5_TABLE_PREFIX.'board_new';
\$g5['login_table'] = G5_TABLE_PREFIX.'login';
\$g5['mail_table'] = G5_TABLE_PREFIX.'mail';
\$g5['member_table'] = G5_TABLE_PREFIX.'member';
\$g5['memo_table'] = G5_TABLE_PREFIX.'memo';
\$g5['poll_table'] = G5_TABLE_PREFIX.'poll';
\$g5['poll_etc_table'] = G5_TABLE_PREFIX.'poll_etc';
\$g5['point_table'] = G5_TABLE_PREFIX.'point';
\$g5['popular_table'] = G5_TABLE_PREFIX.'popular';
\$g5['scrap_table'] = G5_TABLE_PREFIX.'scrap';
\$g5['visit_table'] = G5_TABLE_PREFIX.'visit';
\$g5['visit_sum_table'] = G5_TABLE_PREFIX.'visit_sum';
\$g5['uniqid_table'] = G5_TABLE_PREFIX.'uniqid';
\$g5['autosave_table'] = G5_TABLE_PREFIX.'autosave';
\$g5['cert_history_table'] = G5_TABLE_PREFIX.'cert_history';
\$g5['qa_config_table'] = G5_TABLE_PREFIX.'qa_config';
\$g5['qa_content_table'] = G5_TABLE_PREFIX.'qa_content';
\$g5['content_table'] = G5_TABLE_PREFIX.'content';
\$g5['faq_table'] = G5_TABLE_PREFIX.'faq';
\$g5['faq_master_table'] = G5_TABLE_PREFIX.'faq_master';
\$g5['new_win_table'] = G5_TABLE_PREFIX.'new_win';
\$g5['menu_table'] = G5_TABLE_PREFIX.'menu';
\$g5['social_profile_table'] = G5_TABLE_PREFIX.'member_social_profiles';
\$g5['member_cert_history_table'] = G5_TABLE_PREFIX.'member_cert_history';

define('G5_USE_SHOP', true);
define('G5_SHOP_TABLE_PREFIX', 'yc5_');

\$g5['g5_shop_default_table'] = G5_SHOP_TABLE_PREFIX.'default';
\$g5['g5_shop_banner_table'] = G5_SHOP_TABLE_PREFIX.'banner';
\$g5['g5_shop_cart_table'] = G5_SHOP_TABLE_PREFIX.'cart';
\$g5['g5_shop_category_table'] = G5_SHOP_TABLE_PREFIX.'category';
\$g5['g5_shop_event_table'] = G5_SHOP_TABLE_PREFIX.'event';
\$g5['g5_shop_event_item_table'] = G5_SHOP_TABLE_PREFIX.'event_item';
\$g5['g5_shop_item_table'] = G5_SHOP_TABLE_PREFIX.'item';
\$g5['g5_shop_item_option_table'] = G5_SHOP_TABLE_PREFIX.'item_option';
\$g5['g5_shop_item_use_table'] = G5_SHOP_TABLE_PREFIX.'item_use';
\$g5['g5_shop_item_qa_table'] = G5_SHOP_TABLE_PREFIX.'item_qa';
\$g5['g5_shop_item_relation_table'] = G5_SHOP_TABLE_PREFIX.'item_relation';
\$g5['g5_shop_order_table'] = G5_SHOP_TABLE_PREFIX.'order';
\$g5['g5_shop_order_delete_table'] = G5_SHOP_TABLE_PREFIX.'order_delete';
\$g5['g5_shop_wish_table'] = G5_SHOP_TABLE_PREFIX.'wish';
\$g5['g5_shop_coupon_table'] = G5_SHOP_TABLE_PREFIX.'coupon';
\$g5['g5_shop_coupon_zone_table'] = G5_SHOP_TABLE_PREFIX.'coupon_zone';
\$g5['g5_shop_coupon_log_table'] = G5_SHOP_TABLE_PREFIX.'coupon_log';
\$g5['g5_shop_sendcost_table'] = G5_SHOP_TABLE_PREFIX.'sendcost';
\$g5['g5_shop_personalpay_table'] = G5_SHOP_TABLE_PREFIX.'personalpay';
\$g5['g5_shop_order_address_table'] = G5_SHOP_TABLE_PREFIX.'order_address';
\$g5['g5_shop_item_stocksms_table'] = G5_SHOP_TABLE_PREFIX.'item_stocksms';
\$g5['g5_shop_post_log_table'] = G5_SHOP_TABLE_PREFIX.'order_post_log';
\$g5['g5_shop_order_data_table'] = G5_SHOP_TABLE_PREFIX.'order_data';
\$g5['g5_shop_inicis_log_table'] = G5_SHOP_TABLE_PREFIX.'inicis_log';
?>
DBEOF
echo "✅ data/dbconfig.php 생성 완료"

# 4. data 디렉토리 권한
echo ""
echo "🔐 data/ 권한 설정..."
chmod -R 707 data/ 2>/dev/null || true
echo "✅ 권한 설정 완료"

# 5. npm 의존성 (선택)
if [ -f "package.json" ] && ! [ -d "node_modules" ]; then
    echo ""
    echo "📦 npm 패키지 설치..."
    npm install --silent 2>/dev/null || echo "⚠️  npm install 실패 — node psd_parser.js 실행 시 자동 설치됨"
fi

# 6. 완료
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 세팅 완료!"
echo ""
echo "서버 시작:"
echo "  php -S localhost:$PORT"
echo ""
echo "브라우저 접속:"
echo "  http://localhost:$PORT"
echo ""
echo "관리자 로그인:"
echo "  http://localhost:$PORT/adm/"
echo "  ID: admin / PW: admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
