if (['/support-management/login', '/support-management/scheduler'].includes(location.pathname)) {
  location.replace(`${location.pathname}/${location.search}${location.hash}`);
}
