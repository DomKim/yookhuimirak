<?
include_once("./_common.php");

$url = "http://도메인.com";

$lastmod=date("Y-m-d")."T00:00:00+00:00";

$xmlDoc="<?xml version='1.0' encoding='UTF-8'?>
<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/09/sitemap.xsd'>";
$xmlDoc.="
<url>
  <loc>$url</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

$xmlDoc.="
<url>
  <loc>$url/page/about.html</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

$xmlDoc.="
<url>
  <loc>$url/page/company.html</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

$xmlDoc.="
<url>
  <loc>$url/page/company_info.html</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

$xmlDoc.="
<url>
  <loc>$url/page/location.html</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

$xmlDoc.="
<url>
  <loc>$url/page/guide.html</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

$xmlDoc.="
<url>
  <loc>$url/page/sj_test.html</loc>
  <lastmod>$lastmod</lastmod>
  <priority>0.5</priority>
  <changefreq>daily</changefreq>
</url>";

?>
<?
$query = sql_query("select bo_table from `$g5[board_table]` where bo_read_level='1'");
while($temp = sql_fetch_array($query)) {
	$bo_arr[] = $temp[bo_table];
}
$i = 1;
foreach($bo_arr as $bo) {
	// list of bo_table
$xmlDoc.="
<url>
	<loc>$url/bbs/board.php?bo_table=$bo</loc>";
	$temp = sql_fetch("select wr_datetime from `$g5[write_prefix]$bo` order by wr_datetime DESC");
	$lastmod = str_replace(" ", "T", substr($temp[wr_datetime], 0, 30))."+00:00";

	// if
	if(!$lastmod || strlen($lastmod) < 25 || strcmp($lastmod, "+00:00")) $lastmod = "2014-12-12T00:00:00+00:00";

$xmlDoc.="
	<lastmod>$lastmod</lastmod>
	<changefreq>daily</changefreq>
	<priority>0.9</priority>
</url>";

	$query = sql_query("select wr_id, wr_datetime from `$g5[write_prefix]$bo` where wr_is_comment='0' AND wr_option NOT LIKE '%secret%'");
	while($row = sql_fetch_array($query)) {
		// list of each article
$xmlDoc.="
<url>
	<loc>$url/bbs/board.php?bo_table=$bo&amp;wr_id=$row[wr_id]</loc>
";
		$temp = sql_fetch("select wr_datetime from `$g5[write_prefix]$bo` where wr_parent='$row[wr_id]' order by wr_id DESC");
		$lastmod = str_replace(" ", "T", substr($temp[wr_datetime], 0, 30))."+00:00";
		if(!$lastmod) {
			$temp = sql_fetch("select wr_datetime from `$g5[write_prefix]$bo` where wr_id='$row[wr_id]'");
			$lastmod = str_replace(" ", "T", substr($temp[wr_datetime], 0, 30))."+00:00";
		}
		if(!$lastmod) $lastmod = $g5[time_ymd];
$xmlDoc.="
	<lastmod>$lastmod</lastmod>
	<changefreq>weekly</changefreq>
	<priority>0.5</priority>
</url>";
	}
	$i++;
}
$xmlDoc.="
</urlset>";
$fp = fopen("./sitemap.xml","w");
fputs($fp, $xmlDoc);
fclose($fp);
?>
