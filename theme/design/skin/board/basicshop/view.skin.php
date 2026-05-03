<?php
if (!defined("_GNUBOARD_")) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
?>

<script src="<?php echo G5_JS_URL; ?>/viewimageresize.js"></script>

<style>
    /* 전체 래퍼 */
    .vst-view-wrap {
        font-family: "Pretendard Variable", "Pretendard", "Malgun Gothic", sans-serif;
        color: #333;
        max-width: 100%;
        margin: 0 auto;
        background-color: #fff;
        padding: 40px;
        border-radius: 16px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.03);
        margin-top: 150px;
    }

    /* 제목 영역 */
    .vst-view-head { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    .vst-view-cate { 
        display: inline-block; background: #f0f4ff; color: #3235cd; 
        font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 4px; margin-bottom: 10px; 
    }
    .vst-view-title { font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.4; word-break: break-all; margin: 0; }

    /* 작성 정보 */
    .vst-view-info { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 20px; color: #666; font-size: 13px; }
    .vst-info-left { display: flex; align-items: center; gap: 15px; }
    .vst-info-right { display: flex; align-items: center; gap: 15px; }
    .vst-info-item { display: flex; align-items: center; gap: 5px; }
    .vst-info-item i { color: #999; }

    /* ★ 업체 정보 박스 (커스텀 필드 스타일링) */
    .vst-biz-info {
        background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 40px; border: 1px solid #eee;
    }
    .vst-biz-row {
        display: flex; border-bottom: 1px solid #e5e5e5; padding: 12px 0;
    }
    .vst-biz-row:last-child { border-bottom: none; }
    .vst-biz-th {
        width: 100px; font-weight: 700; color: #555; flex-shrink: 0;
    }
    .vst-biz-td {
        flex: 1; color: #333; font-weight: 500; word-break: break-all;
    }

    /* 본문 영역 */
    .vst-view-content { min-height: 200px; font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 40px; word-break: break-all; }
    .vst-view-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; display: block; }

    /* 첨부파일 & 링크 박스 */
    .vst-file-box { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 0 20px; margin-bottom: 20px; }
    .vst-file-box ul { margin: 0; padding: 0; list-style: none; }
    .vst-file-box li { padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
    .vst-file-box li:last-child { border-bottom: none; }
    .vst-file-box a { color: #333; text-decoration: none; font-weight: 500; }
    .vst-file-box a:hover { text-decoration: underline; color: #3235cd; }
    .vst-file-info { color: #888; font-size: 12px; margin-left: auto; background: #f1f1f1; padding: 2px 8px; border-radius: 4px; }

    /* 추천/비추천 버튼 */
    .vst-action-box { text-align: center; margin: 60px 0 40px; }
    .vst-btn-action { 
        display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
        width: 80px; height: 80px; border-radius: 50%; border: 1px solid #eee; 
        background: #fff; color: #555; transition: 0.2s; text-decoration: none; margin: 0 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .vst-btn-action i { font-size: 24px; margin-bottom: 5px; color: #ccc; transition: 0.2s; }
    .vst-btn-action strong { font-size: 14px; font-weight: 700; }
    
    .vst-btn-good:hover, .vst-btn-good.active { border-color: #3235cd; color: #3235cd; background: #f0f4ff; }
    .vst-btn-good:hover i, .vst-btn-good.active i { color: #3235cd; }
    
    .vst-btn-nogood:hover, .vst-btn-nogood.active { border-color: #fa5252; color: #fa5252; background: #fff5f5; }
    .vst-btn-nogood:hover i, .vst-btn-nogood.active i { color: #fa5252; }

    /* 하단 버튼 그룹 */
    .vst-view-btn { margin-top: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 30px; border-top: 1px solid #eee; }
    .vst-btn-wrap { display: flex; gap: 8px; }
    
    .vst-btn { 
        padding: 10px 18px; border: 1px solid #ddd; background: #fff; color: #555; 
        border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: 0.2s; 
    }
    .vst-btn:hover { border-color: #333; color: #333; background: #f9f9f9; }
    
    .vst-btn-primary { background: #3235cd; color: #fff; border-color: #3235cd; }
    .vst-btn-primary:hover { background: #2629a8; color: #fff; }
    
    .vst-btn-danger { color: #e03131; border-color: #ffa8a8; }
    .vst-btn-danger:hover { background: #fff5f5; border-color: #e03131; }

    /* 반응형 */
    @media (max-width: 768px) {
        .vst-view-wrap { padding: 20px; margin-top: 120px; }
        .vst-view-title { font-size: 22px; }
        .vst-view-info { flex-direction: column; align-items: flex-start; gap: 10px; }
        .vst-info-right { width: 100%; justify-content: flex-start; padding-top: 10px; border-top: 1px dashed #eee; }
        .vst-view-btn { flex-direction: column-reverse; gap: 15px; }
        .vst-btn-wrap { width: 100%; justify-content: space-between; }
        .vst-btn { flex: 1; text-align: center; }
        
        /* 모바일 업체정보 테이블 */
        .vst-biz-th { width: 80px; font-size: 13px; }
        .vst-biz-td { font-size: 13px; }
    }
</style>

<div class="vst-view-wrap">

    <div class="vst-view-head">
        <?php if ($category_name) { ?>
        <span class="vst-view-cate"><?php echo $view['ca_name']; ?></span>
        <?php } ?>
        <h1 class="vst-view-title"><?php echo cut_str(get_text($view['wr_subject']), 255); ?></h1>

        <div class="vst-view-info">
            <div class="vst-info-left">
                <span class="vst-info-item">
                    <i class="fa fa-user-circle"></i> <?php echo $view['name'] ?><?php if ($is_ip_view) { echo "&nbsp;($ip)"; } ?>
                </span>
                <span class="vst-info-item">
                    <i class="fa fa-clock-o"></i> <?php echo date("y-m-d H:i", strtotime($view['wr_datetime'])) ?>
                </span>
            </div>
            <div class="vst-info-right">
                <span class="vst-info-item"><i class="fa fa-eye"></i> <?php echo number_format($view['wr_hit']) ?></span>
                <span class="vst-info-item"><a href="#bo_vc" style="text-decoration:none; color:inherit;"><i class="fa fa-comment-o"></i> <?php echo number_format($view['wr_comment']) ?></a></span>
            </div>
        </div>
    </div>

    <?php if ($cnt > 0) { ?>
    <div class="vst-file-box">
        <ul>
        <?php
        for ($i=0; $i<count($view['file']); $i++) {
            if (isset($view['file'][$i]['source']) && $view['file'][$i]['source'] && !$view['file'][$i]['view']) {
        ?>
            <li>
                <i class="fa fa-download" style="color:#3235cd;"></i>
                <a href="<?php echo $view['file'][$i]['href']; ?>" class="view_file_download">
                    <strong><?php echo $view['file'][$i]['source'] ?></strong>
                </a>
                <span class="vst-file-info">
                    <?php echo $view['file'][$i]['content'] ?> (<?php echo $view['file'][$i]['size'] ?>) | <?php echo $view['file'][$i]['download'] ?>회
                </span>
            </li>
        <?php
            }
        }
        ?>
        </ul>
    </div>
    <?php } ?>

    <?php if (isset($view['link'][1]) && $view['link'][1]) { ?>
    <div class="vst-file-box">
        <ul>
        <?php
        for ($i=1; $i<=count($view['link']); $i++) {
            if ($view['link'][$i]) {
        ?>
            <li>
                <i class="fa fa-link" style="color:#3235cd;"></i>
                <a href="<?php echo $view['link_href'][$i] ?>" target="_blank">
                    <strong><?php echo cut_str($view['link'][$i], 70) ?></strong>
                </a>
                <span class="vst-file-info"><?php echo $view['link_hit'][$i] ?>회 연결</span>
            </li>
        <?php
            }
        }
        ?>
        </ul>
    </div>
    <?php } ?>

    <section class="vst-view-content">
        <?php
        $v_img_count = count($view['file']);
        if($v_img_count) {
            echo "<div id=\"bo_v_img\">\n";
            for ($i=0; $i<=count($view['file']); $i++) {
                if ($view['file'][$i]['view']) {
                    echo get_view_thumbnail($view['file'][$i]['view']);
                }
            }
            echo "</div>\n";
        }
        ?>

        <div class="vst-biz-info">
            <div class="vst-biz-row">
                <div class="vst-biz-th">업체명</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_subject']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">신규/기존</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_6']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">상세주소</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_4']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">전화번호</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_2']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">네이버링크</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_5']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">영업시간</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_3']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">위도</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_7']), 70); ?></div>
            </div>
            <div class="vst-biz-row">
                <div class="vst-biz-th">경도</div>
                <div class="vst-biz-td"><?php echo cut_str(get_text($view['wr_8']), 70); ?></div>
            </div>
        </div>

        <div id="bo_v_con"><?php echo get_view_thumbnail(html_entity_decode($view['content'])); ?></div>
        
        <?php if ($is_signature) { ?><p style="margin-top:50px; color:#888; font-size:13px; border-top:1px dashed #eee; padding-top:20px;"><?php echo $signature ?></p><?php } ?>
    </section>

    <?php if ( $good_href || $nogood_href) { ?>
    <div class="vst-action-box">
        <?php if ($good_href) { ?>
        <a href="<?php echo $good_href.'&amp;'.$qstr ?>" id="good_button" class="vst-btn-action vst-btn-good">
            <i class="fa fa-thumbs-up"></i>
            <strong>추천 <?php echo number_format($view['wr_good']) ?></strong>
        </a>
        <b id="bo_v_act_good"></b>
        <?php } ?>

        <?php if ($nogood_href) { ?>
        <a href="<?php echo $nogood_href.'&amp;'.$qstr ?>" id="nogood_button" class="vst-btn-action vst-btn-nogood">
            <i class="fa fa-thumbs-down"></i>
            <strong>비추천 <?php echo number_format($view['wr_nogood']) ?></strong>
        </a>
        <b id="bo_v_act_nogood"></b>
        <?php } ?>
    </div>
    <?php } ?>

    <div id="bo_v_share" style="text-align:right; margin-bottom:20px;">
        <?php if ($scrap_href) { ?>
            <a href="<?php echo $scrap_href; ?>" target="_blank" class="vst-btn" onclick="win_scrap(this.href); return false;">
                <i class="fa fa-thumb-tack"></i> 스크랩
            </a>
        <?php } ?>
        <?php include_once(G5_SNS_PATH."/view.sns.skin.php"); ?>
    </div>

    <div class="vst-view-btn">
        <div class="vst-btn-wrap">
            <?php if ($update_href) { ?><a href="<?php echo $update_href ?>" class="vst-btn">수정</a><?php } ?>
            <?php if ($delete_href) { ?><a href="<?php echo $delete_href ?>" class="vst-btn vst-btn-danger" onclick="del(this.href); return false;">삭제</a><?php } ?>
            <?php if ($copy_href) { ?><a href="<?php echo $copy_href ?>" class="vst-btn" onclick="board_move(this.href); return false;">복사</a><?php } ?>
            <?php if ($move_href) { ?><a href="<?php echo $move_href ?>" class="vst-btn" onclick="board_move(this.href); return false;">이동</a><?php } ?>
            <?php if ($search_href) { ?><a href="<?php echo $search_href ?>" class="vst-btn">검색</a><?php } ?>
        </div>

        <div class="vst-btn-wrap">
            <a href="<?php echo $list_href ?>" class="vst-btn">목록</a>
            <?php if ($write_href) { ?><a href="<?php echo $write_href ?>" class="vst-btn vst-btn-primary">글쓰기</a><?php } ?>
        </div>
    </div>

    <?php
    include_once(G5_BBS_PATH.'/view_comment.php');
    ?>

</div>

<script>
<?php if ($board['bo_download_point'] < 0) { ?>
$(function() {
    $("a.view_file_download").click(function() {
        if(!g5_is_member) {
            alert("다운로드 권한이 없습니다.\n회원이시라면 로그인 후 이용해 보십시오.");
            return false;
        }

        var msg = "파일을 다운로드 하시면 포인트가 차감(<?php echo number_format($board['bo_download_point']) ?>점)됩니다.\n\n포인트는 게시물당 한번만 차감되며 다음에 다시 다운로드 하셔도 중복하여 차감하지 않습니다.\n\n그래도 다운로드 하시겠습니까?";

        if(confirm(msg)) {
            var href = $(this).attr("href")+"&js=on";
            $(this).attr("href", href);
            return true;
        } else {
            return false;
        }
    });
});
<?php } ?>

function board_move(href) {
    window.open(href, "boardmove", "left=50, top=50, width=500, height=550, scrollbars=1");
}

$(function() {
    $("a.view_image").click(function() {
        window.open(this.href, "large_image", "location=yes,links=no,toolbar=no,top=10,left=10,width=10,height=10,resizable=yes,scrollbars=no,status=no");
        return false;
    });

    // 추천, 비추천
    $("#good_button, #nogood_button").click(function() {
        var $tx;
        if(this.id == "good_button")
            $tx = $("#bo_v_act_good");
        else
            $tx = $("#bo_v_act_nogood");

        excute_good(this.href, $(this), $tx);
        return false;
    });

    // 이미지 리사이즈
    $("#bo_v_atc").viewimageresize();

    // sns공유
    $(".btn_share").click(function(){
        $("#bo_v_sns").fadeIn();
    });

    $(document).mouseup(function (e) {
        var container = $("#bo_v_sns");
        if (!container.is(e.target) && container.has(e.target).length === 0){
            container.css("display","none");
        }
    });
});

function excute_good(href, $el, $tx) {
    $.post(
        href,
        { js: "on" },
        function(data) {
            if(data.error) {
                alert(data.error);
                return false;
            }

            if(data.count) {
                $el.find("strong").text(number_format(String(data.count)));
                if($tx.attr("id").search("nogood") > -1) {
                    $tx.text("이 글을 비추천하셨습니다.");
                    $tx.fadeIn(200).delay(2500).fadeOut(200);
                } else {
                    $tx.text("이 글을 추천하셨습니다.");
                    $tx.fadeIn(200).delay(2500).fadeOut(200);
                }
            }
        }, "json"
    );
}
</script>