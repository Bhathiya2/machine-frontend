export function warrantyStatus(installDate: string, warrantyPeriod?: string) {
  const install = new Date(installDate);
  const expires = new Date(install);

  let years = 1;
  if (warrantyPeriod) {
    const match = warrantyPeriod.match(/^(\d+)/);
    if (match) {
      years = parseInt(match[1], 10);
    }
  }

  expires.setFullYear(expires.getFullYear() + years);
  const now = new Date();
  const active = now < expires;

  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let label = "";
  if (active) {
    if (diffDays > 365) {
      label = `Expires in ~${Math.floor(diffDays / 365)} years`;
    } else if (diffDays > 30) {
      label = `Expires in ~${Math.floor(diffDays / 30)} months`;
    } else {
      label = `Expires in ${diffDays} days`;
    }
  } else {
    label = "Expired";
  }

  return {
    active,
    label,
    expires: expires.toISOString().split("T")[0],
  };
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtCurrency(n: number) {
  return (
    "৳" +
    n.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}
