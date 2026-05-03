<?php
$sub_menu = "700200";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "게시판 여분필드추가";
include_once(G5_ADMIN_PATH.'/admin.head.php');

$board_query = 'select * from g5_board'; // 게시판가져오기
$board_query_result = sql_query($board_query);

$board_add_query = 'selet ';
?>

<form name="fconfigform" id="fconfigform" method="post" action="./board_wr_add_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">


<section id="anc_cf_block">

  <div class="local_desc01 local_desc">
    <p>
        게시판의 여분필드는 10개 기본셋팅 입니다. 여분필드가 더 필요할 경우만 추가해주세요.<br>
    </p>
  </div>

  <h2 class="h2_frm">게시판 여분필드추가</h2>

  <div class="tbl_frm01 tbl_wrap">
    <table>
      <caption>컨텐츠 블럭 생성</caption>
      <colgroup>
          <col class="grid_4">
          <col>
          <col class="grid_4">
          <col>
      </colgroup>
      <tbody>
      <?php
      for ($i=0; $row=sql_fetch_array($board_query_result); $i++) {
        $extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
        WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = 'g5_write_".$row[bo_table]."' AND TABLE_SCHEMA = '".G5_MYSQL_USER."'
        AND COLUMN_NAME
        NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
        $cnt = sql_fetch($extend_column);
        $filedCount = $cnt['cnt'];
      ?>
      <tr>
          <th scope="row"><?=$row['bo_subject']?></th>
          <td>
              <input type="text" name="wr_count" class="frm_input" placeholder="<?=$filedCount?>" readonly>
              <a href="./board_wr_add_update.php?send=update&bo_table=<?=$row['bo_table']?>" class="btn_submit btn">추가</a>
              <a href="./board_wr_add_update.php?send=delete&bo_table=<?=$row['bo_table']?>" class="btn_submit btn">삭제</a>
          </td>
      </tr>
      <?php }?>
      </tbody>
    </table>
  </div>

</section>

</form>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
