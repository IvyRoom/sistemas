if (['/atendimentos/login', '/atendimentos/agendamento'].includes(location.pathname)) {
  location.replace(`${location.pathname}/${location.search}${location.hash}`);
}
