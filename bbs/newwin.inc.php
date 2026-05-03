<?php
if (!defined("_GNUBOARD_")) exit; // 개별 페이지 접근 불가

if (!defined('_SHOP_')) {
    $pop_division = 'comm';
} else {
    $pop_division = 'shop';
}

// 팝업레이어 테이블에 쇼핑몰, 커뮤니티 인지 구분하는 여부 필드 추가
$sql = " ALTER TABLE `{$g5['new_win_table']}` ADD `nw_order` VARCHAR(10) not null DEFAULT '0'";
sql_query($sql, false);

$sql = " select * from {$g5['new_win_table']}
          where '".G5_TIME_YMDHIS."' between nw_begin_time and nw_end_time
            and nw_device IN ( 'both', 'pc' ) and nw_division IN ( 'both', '".$pop_division."' )
          order by nw_order asc, nw_id asc";
$result = sql_query($sql, false);
?>
<style>
    .hd_pops_footer{
        display: flex;
        justify-content: space-around;
        align-items: center;
        width: 100%;
        font-family: pretendard-bold !important;
    }
    .hd_pops_footer button{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 33%;
        position: relative !important;
        color: #666 !important;
        background: #f7f7f7 !important;
        font-family: pretendard-regular !important;
    }
    .hd_pops_footer .hd_pops_reject{
    }
    .hd_pops_close_all{
        border-left: 1px solid rgba(0,0,0,0.07) !important;
        border-right: 1px solid rgba(0,0,0,0.07) !important;
    }
    .hd_pops_con >p{
        display: flex;
    }
    .hd_pops_footer {
        background: #f7f7f7 !important;
    }
    #hd_pop > div {
        overflow: hidden;
        background: #f7f7f7 !important;
        border-radius: unset !important;
    }
    
</style>
<!-- 팝업레이어 시작 { -->
<div id="hd_pop">
    <h2>팝업레이어 알림</h2>

<?php
for ($i=0; $nw=sql_fetch_array($result); $i++)
{
    // 이미 체크 되었다면 Continue
    if (isset($_COOKIE["hd_pops_{$nw['nw_id']}"]) && $_COOKIE["hd_pops_{$nw['nw_id']}"])
        continue;
?>

    <div id="hd_pops_<?php echo $nw['nw_id'] ?>" class="hd_pops" style="top:<?php echo $nw['nw_top']?>px;left:<?php echo $nw['nw_left']?>px">
        <div class="hd_pops_con" style="width:<?php echo $nw['nw_width'] ?>px;height:<?php echo $nw['nw_height'] ?>px">
            <?php echo conv_content($nw['nw_content'], 1); ?>
        </div>
        <div class="hd_pops_footer">
            <button class="hd_pops_reject hd_pops_<?php echo $nw['nw_id']; ?> <?php echo $nw['nw_disable_hours']; ?>"><strong><?php echo $nw['nw_disable_hours']; ?></strong>시간 닫기</button>
            <button  class="hd_pops_close_all hd_pops_close">팝업전체닫기</button>
            <button class="hd_pops_close hd_pops_<?php echo $nw['nw_id']; ?>">닫기</button>
        </div>
    </div>
<?php }
if ($i == 0) echo '<span class="sound_only">팝업레이어 알림이 없습니다.</span>';
?>
</div>

<script>
$(function() {
    $(".hd_pops_reject").click(function() {
        var id = $(this).attr('class').split(' ');
        var ck_name = id[1];
        var exp_time = parseInt(id[2]);
        $("#"+id[1]).css("display", "none");
        set_cookie(ck_name, 1, exp_time, g5_cookie_domain);
    });
    $('.hd_pops_close').click(function() {
        var idb = $(this).attr('class').split(' ');
        $('#'+idb[1]).css('display','none');
    });
    $("#hd").css("z-index", 1000);
    $('.hd_pops_close_all').on('click',function(){
    	$('#hd_pop div').hide();
        
        var sections = document.querySelectorAll('section');

        sections.forEach(function(section) {
            section.style.removeProperty('filter');
            section.style.removeProperty('pointer-events');
        });
    })
});
</script>
<!-- } 팝업레이어 끝 -->