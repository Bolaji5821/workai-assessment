from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING

from jinja2 import Environment, FileSystemLoader, select_autoescape

if TYPE_CHECKING:
    from app.schemas.briefing import BriefingReportData

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Professional report formatter using Jinja2 templates."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def render_base(self, title: str, body: str, generated_at: str) -> str:
        """Render the base HTML template with the report content."""
        template = self._env.get_template("base.html")
        return template.render(title=title, body=body, generated_at=generated_at)

    def render_briefing_report(self, report_data: "BriefingReportData") -> str:
        """Render a professional briefing report using Jinja2 template."""
        # Format the generated timestamp for display
        formatted_timestamp = report_data.generated_at.strftime('%B %d, %Y at %I:%M %p UTC')
        
        # Render the briefing report content
        template = self._env.get_template("briefing_report.html")
        body_content = template.render(
            company_name=report_data.company_name,
            ticker=report_data.ticker,
            sector=report_data.sector,
            analyst_name=report_data.analyst_name,
            summary=report_data.summary,
            recommendation=report_data.recommendation,
            key_points=report_data.key_points,
            risks=report_data.risks,
            metrics=report_data.metrics,
            generated_at=formatted_timestamp
        )
        
        # Render the complete HTML document
        return self.render_base(
            title=f"Investment Briefing - {report_data.company_name} ({report_data.ticker})",
            body=body_content,
            generated_at=formatted_timestamp
        )

    @staticmethod
    def generated_timestamp() -> str:
        """Get current timestamp in ISO format."""
        return datetime.now(timezone.utc).isoformat()


def render_briefing_report(report_data: "BriefingReportData") -> str:
    """Convenience function to render a briefing report."""
    formatter = ReportFormatter()
    return formatter.render_briefing_report(report_data)