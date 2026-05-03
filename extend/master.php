<?php
// 관리자 권한을 준 계정에 관리자페이지 접근권한을 준다.
if(defined('G5_IS_ADMIN')){

  $auth = array();
  $sql = " select au_menu, au_auth from {$g5['auth_table']} where mb_id = '{$member['mb_id']}' ";
  $result = sql_query($sql);
  for($i=0; $row=sql_fetch_array($result); $i++)
  {
      $auth[$row['au_menu']] = $row['au_auth'];
      if($sub_menu == $row['au_menu']){
        $is_admin='super';
      }
  }

}
?>
